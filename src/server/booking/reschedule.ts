import { db } from "@/lib/db"

export class RescheduleError extends Error {
  constructor(
    public code:
      | "NOT_FOUND"
      | "INVALID_STATUS"
      | "SLOT_TAKEN"
      | "IN_PAST"
      | "INVALID",
    message: string,
  ) {
    super(message)
  }
}

const RESCHEDULABLE_STATUSES = new Set(["PENDING", "CONFIRMED"])

/**
 * Move o startsAt/endsAt de uma booking preservando a duração. A constraint
 * EXCLUDE no DB (`booking_no_overlap_per_professional`) impede sobreposição
 * com outras bookings ativas do mesmo profissional, então o UPDATE falha com
 * 23P01 se houver conflito — capturado aqui como SLOT_TAKEN.
 *
 * Não checa bloqueios: o painel é manual e pode sobrepor um bloco
 * intencionalmente (mesma postura do createBooking).
 */
export async function rescheduleBooking(
  establishmentId: string,
  bookingId: string,
  newStartsAt: Date,
) {
  if (Number.isNaN(newStartsAt.getTime())) {
    throw new RescheduleError("INVALID", "Data inválida")
  }
  if (newStartsAt.getTime() < Date.now() - 60_000) {
    throw new RescheduleError("IN_PAST", "Não é possível mover para o passado")
  }

  const booking = await db.booking.findFirst({
    where: { id: bookingId, establishmentId },
    select: { id: true, status: true, startsAt: true, endsAt: true },
  })
  if (!booking) throw new RescheduleError("NOT_FOUND", "Agendamento não encontrado")

  if (!RESCHEDULABLE_STATUSES.has(booking.status)) {
    throw new RescheduleError(
      "INVALID_STATUS",
      "Só agendamentos pendentes ou confirmados podem ser remarcados",
    )
  }

  const durationMs = booking.endsAt.getTime() - booking.startsAt.getTime()
  const newEndsAt = new Date(newStartsAt.getTime() + durationMs)

  try {
    return await db.booking.update({
      where: { id: bookingId },
      data: { startsAt: newStartsAt, endsAt: newEndsAt },
    })
  } catch (err: unknown) {
    const code = (err as { code?: string }).code
    if (code === "23P01") {
      throw new RescheduleError("SLOT_TAKEN", "Horário já reservado, escolha outro")
    }
    throw err
  }
}
