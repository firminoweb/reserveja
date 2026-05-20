import { formatAddressOneLine } from "@/lib/address"
import { db } from "@/lib/db"
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
  } catch (err) {
    console.error("[notify] erro inesperado em sendBookingConfirmation", err)
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

    const result = await sendText({ phone: booking.clientPhone, message })
    return result.ok
  } catch (err) {
    console.error("[notify] erro inesperado em sendBookingReminder", err)
    return false
  }
}
