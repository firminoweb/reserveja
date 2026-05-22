import { formatAddressOneLine } from "@/lib/address"
import { db } from "@/lib/db"
import { getFromAddress, sendEmail } from "@/lib/email"
import { buildIcs } from "@/lib/ics"
import { sendPushForBooking } from "@/lib/push"
import { formatLocal } from "@/lib/time"
import { sendText } from "@/lib/whatsapp"

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000"
}

/**
 * Envia mensagem de confirmação por WhatsApp. Idempotência fica por conta do
 * caller — esta função sempre tenta enviar.
 *
 * Erros são logados, nunca propagados: notificação não deve quebrar o booking.
 */
export async function sendBookingConfirmation(bookingId: string): Promise<void> {
  try {
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: { select: { name: true } },
        professional: { select: { name: true } },
        establishment: {
          select: {
            slug: true,
            name: true,
            timezone: true,
            street: true,
            streetNumber: true,
            neighborhood: true,
            city: true,
            state: true,
          },
        },
      },
    })
    if (!booking) {
      console.warn("[notify] booking não encontrado", bookingId)
      return
    }

    const tz = booking.establishment.timezone
    const dateLine = formatLocal(booking.startsAt, tz, "EEEE, dd/MM 'às' HH:mm")
    const link = `${appUrl()}/${booking.establishment.slug}/b/${booking.publicToken}`
    const firstName = booking.clientName.split(" ")[0]
    const addressLine = formatAddressOneLine(booking.establishment)

    const message = [
      `Olá ${firstName}! Seu horário em ${booking.establishment.name} está confirmado.`,
      ``,
      `📅 ${dateLine}`,
      `✂️ ${booking.service.name} com ${booking.professional.name}`,
      addressLine ? `📍 ${addressLine}` : "",
      ``,
      `Pra cancelar ou ver o agendamento:`,
      link,
    ]
      .filter(Boolean)
      .join("\n")

    const result = await sendText({ phone: booking.clientPhone, message })
    if (!result.ok) {
      console.warn("[notify] falha ao enviar confirmação", bookingId)
    }

    if (booking.clientEmail) {
      const ics = buildIcs({
        uid: booking.publicToken,
        sequence: 0,
        method: "REQUEST",
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
        timezone: tz,
        summary: `${booking.service.name} — ${booking.establishment.name}`,
        description: [
          `Agendamento com ${booking.professional.name}.`,
          ``,
          `Gerencie ou cancele:`,
          link,
        ].join("\n"),
        location: addressLine || undefined,
        url: link,
        organizerEmail: getFromAddress(),
        organizerName: booking.establishment.name,
        attendeeEmail: booking.clientEmail,
        attendeeName: booking.clientName,
      })

      const html = [
        `<p>Olá <strong>${firstName}</strong>! Seu horário em <strong>${booking.establishment.name}</strong> está confirmado.</p>`,
        `<p><strong>📅 ${dateLine}</strong><br>✂️ ${booking.service.name} com ${booking.professional.name}</p>`,
        addressLine ? `<p>📍 ${addressLine}</p>` : "",
        `<p>O convite anexo adiciona o evento ao seu calendário (Google, Apple ou Outlook) com lembrete 30min antes.</p>`,
        `<p><a href="${link}">Ver ou cancelar agendamento</a></p>`,
      ]
        .filter(Boolean)
        .join("")

      await sendEmail({
        to: booking.clientEmail,
        subject: `Confirmado: ${dateLine} — ${booking.establishment.name}`,
        text: message,
        html,
        attachments: [
          {
            filename: "agendamento.ics",
            content: ics,
            contentType: "text/calendar; method=REQUEST; charset=utf-8",
          },
        ],
      })
    }
  } catch (err) {
    console.error("[notify] erro inesperado em sendBookingConfirmation", err)
  }
}

/**
 * Envia .ics com METHOD:CANCEL pra que o calendário do cliente (Google, Apple,
 * Outlook) remova o evento automaticamente. UID estável + SEQUENCE > 0.
 */
export async function sendBookingCancellation(bookingId: string): Promise<void> {
  try {
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: { select: { name: true } },
        professional: { select: { name: true } },
        establishment: {
          select: {
            slug: true,
            name: true,
            timezone: true,
            street: true,
            streetNumber: true,
            neighborhood: true,
            city: true,
            state: true,
          },
        },
      },
    })
    if (!booking) return
    if (!booking.clientEmail) return

    const tz = booking.establishment.timezone
    const dateLine = formatLocal(booking.startsAt, tz, "EEEE, dd/MM 'às' HH:mm")
    const link = `${appUrl()}/${booking.establishment.slug}/b/${booking.publicToken}`
    const addressLine = formatAddressOneLine(booking.establishment)

    const ics = buildIcs({
      uid: booking.publicToken,
      sequence: 1,
      method: "CANCEL",
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
      timezone: tz,
      summary: `${booking.service.name} — ${booking.establishment.name}`,
      description: `Agendamento cancelado.`,
      location: addressLine || undefined,
      url: link,
      organizerEmail: getFromAddress(),
      organizerName: booking.establishment.name,
      attendeeEmail: booking.clientEmail,
      attendeeName: booking.clientName,
    })

    await sendEmail({
      to: booking.clientEmail,
      subject: `Cancelado: ${dateLine} — ${booking.establishment.name}`,
      text: `Seu horário em ${booking.establishment.name} no dia ${dateLine} foi cancelado.`,
      html: `<p>Seu horário em <strong>${booking.establishment.name}</strong> em <strong>${dateLine}</strong> foi cancelado.</p><p>O evento será removido do seu calendário automaticamente.</p>`,
      attachments: [
        {
          filename: "cancelamento.ics",
          content: ics,
          contentType: "text/calendar; method=CANCEL; charset=utf-8",
        },
      ],
    })
  } catch (err) {
    console.error("[notify] erro inesperado em sendBookingCancellation", err)
  }
}

/**
 * Envia lembrete de "está chegando o horário". Retorna true se enviou com
 * sucesso pra que o caller possa marcar reminderSentAt e evitar reenvio.
 */
export async function sendBookingReminder(bookingId: string): Promise<boolean> {
  try {
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: { select: { name: true } },
        professional: { select: { name: true } },
        establishment: {
          select: {
            slug: true,
            name: true,
            timezone: true,
            street: true,
            streetNumber: true,
            neighborhood: true,
            city: true,
            state: true,
          },
        },
      },
    })
    if (!booking) {
      console.warn("[notify] booking não encontrado", bookingId)
      return false
    }

    const tz = booking.establishment.timezone
    const timeLine = formatLocal(booking.startsAt, tz, "HH:mm")
    const link = `${appUrl()}/${booking.establishment.slug}/b/${booking.publicToken}`
    const firstName = booking.clientName.split(" ")[0]
    const addressLine = formatAddressOneLine(booking.establishment)

    const message = [
      `Oi ${firstName}! Lembrete: você tem horário daqui a pouco em ${booking.establishment.name}.`,
      ``,
      `📅 hoje às ${timeLine}`,
      `✂️ ${booking.service.name} com ${booking.professional.name}`,
      addressLine ? `📍 ${addressLine}` : "",
      ``,
      `Precisa cancelar? ${link}`,
    ]
      .filter(Boolean)
      .join("\n")

    // WhatsApp + Web Push em paralelo. Push tem custo zero e é "fire and forget"
    // do ponto de vista do reminderSentAt — o resultado que conta pra idempotência
    // ainda é o WhatsApp (canal principal).
    const [waResult] = await Promise.all([
      sendText({ phone: booking.clientPhone, message }),
      sendPushForBooking(bookingId, {
        title: `Lembrete: ${booking.establishment.name}`,
        body: `Hoje às ${timeLine} — ${booking.service.name} com ${booking.professional.name}`,
        url: `/${booking.establishment.slug}/b/${booking.publicToken}`,
        tag: `booking-${booking.publicToken}`,
      }),
    ])

    return waResult.ok
  } catch (err) {
    console.error("[notify] erro inesperado em sendBookingReminder", err)
    return false
  }
}
