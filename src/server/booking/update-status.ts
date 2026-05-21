import { db } from "@/lib/db"
import type { BookingStatus } from "@prisma/client"

type ErrorCode = "NOT_FOUND" | "INVALID_TRANSITION" | "TOO_LATE" | "SLOT_TAKEN"

export class BookingStatusError extends Error {
  constructor(public code: ErrorCode, message: string) {
    super(message)
  }
}

const ALLOWED: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED", "NO_SHOW", "COMPLETED"],
  CONFIRMED: ["CANCELLED", "NO_SHOW", "COMPLETED"],
  CANCELLED: ["CONFIRMED"],
  NO_SHOW: ["CONFIRMED"],
  COMPLETED: ["CONFIRMED"],
}

export async function updateBookingStatus(
  establishmentId: string,
  bookingId: string,
  next: BookingStatus,
) {
  const booking = await db.booking.findFirst({
    where: { id: bookingId, establishmentId },
    select: { id: true, status: true, endsAt: true },
  })
  if (!booking) throw new BookingStatusError("NOT_FOUND", "Agendamento não encontrado")

  if (!ALLOWED[booking.status].includes(next)) {
    throw new BookingStatusError(
      "INVALID_TRANSITION",
      `Não é possível mudar de ${booking.status} para ${next}`,
    )
  }

  // Reabrir só faz sentido enquanto o atendimento ainda não terminou.
  const isReopen =
    (booking.status === "CANCELLED" ||
      booking.status === "NO_SHOW" ||
      booking.status === "COMPLETED") &&
    next === "CONFIRMED"
  if (isReopen && booking.endsAt.getTime() <= Date.now()) {
    throw new BookingStatusError(
      "TOO_LATE",
      "Não é possível reabrir um agendamento que já terminou",
    )
  }

  try {
    return await db.booking.update({
      where: { id: bookingId },
      data: {
        status: next,
        ...(next === "CANCELLED"
          ? { cancelledAt: new Date(), cancelledBy: "ESTABLISHMENT" }
          : isReopen
            ? { cancelledAt: null, cancelledBy: null }
            : {}),
      },
    })
  } catch (err: unknown) {
    // Reabrir pode colidir com outro agendamento que tomou o slot (EXCLUDE).
    const code = (err as { code?: string }).code
    if (code === "23P01") {
      throw new BookingStatusError(
        "SLOT_TAKEN",
        "Outro agendamento já ocupou esse horário",
      )
    }
    throw err
  }
}
