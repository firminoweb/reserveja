import { formatAddressOneLine } from "@/lib/address"
import { db } from "@/lib/db"
import { getFromAddress, sendEmail } from "@/lib/email"
import { emailButton, emailLayout, emailMuted } from "@/lib/email-template"
import { formatNationalBR } from "@/lib/phone"
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

      const html = emailLayout([
        `<p>Olá <strong>${firstName}</strong>! Seu horário está confirmado.</p>`,
        `<table style="margin:16px 0;font-size:14px">`,
        `<tr><td style="padding:4px 12px 4px 0;color:#6b7280">Local</td><td><strong>${booking.establishment.name}</strong></td></tr>`,
        `<tr><td style="padding:4px 12px 4px 0;color:#6b7280">Quando</td><td><strong>${dateLine}</strong></td></tr>`,
        `<tr><td style="padding:4px 12px 4px 0;color:#6b7280">Serviço</td><td>${booking.service.name} com ${booking.professional.name}</td></tr>`,
        addressLine ? `<tr><td style="padding:4px 12px 4px 0;color:#6b7280">Endereço</td><td>${addressLine}</td></tr>` : "",
        `</table>`,
        `<p style="font-size:13px;color:#6b7280">O convite anexo adiciona o evento ao seu calendário com lembrete 30min antes.</p>`,
        `<p style="text-align:center;margin:24px 0">${emailButton(link, "Ver ou cancelar agendamento")}</p>`,
      ].filter(Boolean).join(""))

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
      html: emailLayout([
        `<p>Seu horário em <strong>${booking.establishment.name}</strong> foi cancelado.</p>`,
        `<table style="margin:16px 0;font-size:14px">`,
        `<tr><td style="padding:4px 12px 4px 0;color:#6b7280">Quando</td><td>${dateLine}</td></tr>`,
        `<tr><td style="padding:4px 12px 4px 0;color:#6b7280">Serviço</td><td>${booking.service.name} com ${booking.professional.name}</td></tr>`,
        `</table>`,
        emailMuted("O evento será removido do seu calendário automaticamente."),
      ].join("")),
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
 * Notifica donos e staff do estabelecimento sobre um novo agendamento.
 * Respeita MembershipUnit: sem rows = acesso total (notifica); com rows =
 * só notifica se a unidade do booking está listada.
 */
export async function sendNewBookingToOwners(bookingId: string): Promise<void> {
  try {
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: { select: { name: true, priceCents: true } },
        professional: { select: { name: true } },
        establishment: {
          select: {
            id: true,
            name: true,
            timezone: true,
            organizationId: true,
          },
        },
      },
    })
    if (!booking) return

    const members = await db.membership.findMany({
      where: { organizationId: booking.establishment.organizationId },
      include: {
        user: { select: { email: true, name: true } },
        units: { select: { establishmentId: true } },
      },
    })

    const estId = booking.establishment.id
    const eligible = members.filter((m) => {
      if (m.units.length === 0) return true
      return m.units.some((u) => u.establishmentId === estId)
    })
    if (eligible.length === 0) return

    const tz = booking.establishment.timezone
    const dateLine = formatLocal(booking.startsAt, tz, "EEEE, dd/MM 'às' HH:mm")
    const phoneFmt = formatNationalBR(booking.clientPhone)
    const priceStr =
      booking.service.priceCents > 0
        ? `R$ ${(booking.service.priceCents / 100).toFixed(2).replace(".", ",")}`
        : "Gratuito"
    const panelUrl = `${appUrl()}/painel/agenda`

    const subject = `Novo agendamento: ${booking.clientName} — ${booking.service.name}`
    const text = [
      `Novo agendamento em ${booking.establishment.name}:`,
      ``,
      `Cliente: ${booking.clientName}`,
      `Telefone: ${phoneFmt}`,
      booking.clientEmail ? `E-mail: ${booking.clientEmail}` : "",
      `Serviço: ${booking.service.name} (${priceStr})`,
      `Profissional: ${booking.professional.name}`,
      `Quando: ${dateLine}`,
      ``,
      `Ver na agenda: ${panelUrl}`,
    ]
      .filter(Boolean)
      .join("\n")

    const html = emailLayout([
      `<p>Novo agendamento em <strong>${booking.establishment.name}</strong>:</p>`,
      `<table style="margin:16px 0;font-size:14px">`,
      `<tr><td style="padding:4px 12px 4px 0;color:#6b7280">Cliente</td><td><strong>${booking.clientName}</strong></td></tr>`,
      `<tr><td style="padding:4px 12px 4px 0;color:#6b7280">Telefone</td><td>${phoneFmt}</td></tr>`,
      booking.clientEmail
        ? `<tr><td style="padding:4px 12px 4px 0;color:#6b7280">E-mail</td><td>${booking.clientEmail}</td></tr>`
        : "",
      `<tr><td style="padding:4px 12px 4px 0;color:#6b7280">Serviço</td><td>${booking.service.name} (${priceStr})</td></tr>`,
      `<tr><td style="padding:4px 12px 4px 0;color:#6b7280">Profissional</td><td>${booking.professional.name}</td></tr>`,
      `<tr><td style="padding:4px 12px 4px 0;color:#6b7280">Quando</td><td><strong>${dateLine}</strong></td></tr>`,
      `</table>`,
      `<p style="text-align:center;margin:24px 0">${emailButton(panelUrl, "Ver na agenda")}</p>`,
    ].filter(Boolean).join(""))

    await Promise.all(
      eligible.map((m) =>
        sendEmail({ to: m.user.email, subject, text, html }),
      ),
    )
  } catch (err) {
    console.error("[notify] erro em sendNewBookingToOwners", err)
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
