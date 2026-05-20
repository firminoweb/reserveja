import { db } from "@/lib/db"
import type { BookingStatus } from "@prisma/client"

export class BookingStatusError extends Error {
  constructor(public code: "NOT_FOUND" | "INVALID_TRANSITION", message: string) {
    super(message)
  }
}

const ALLOWED: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED", "NO_SHOW", "COMPLETED"],
  CONFIRMED: ["CANCELLED", "NO_SHOW", "COMPLETED"],
  CANCELLED: [],
  NO_SHOW: ["CONFIRMED"],
  COMPLETED: [],
}

export async function updateBookingStatus(
  establishmentId: string,
  bookingId: string,
  next: BookingStatus,
) {
  const booking = await db.booking.findFirst({
    where: { id: bookingId, establishmentId },
    select: { id: true, status: true },
  })
  if (!booking) throw new BookingStatusError("NOT_FOUND", "Agendamento não encontrado")

  if (!ALLOWED[booking.status].includes(next)) {
    throw new BookingStatusError(
      "INVALID_TRANSITION",
      `Não é possível mudar de ${booking.status} para ${next}`,
    )
  }

  return db.booking.update({
    where: { id: bookingId },
    data: {
      status: next,
      ...(next === "CANCELLED"
        ? { cancelledAt: new Date(), cancelledBy: "ESTABLISHMENT" }
        : {}),
    },
  })
}
