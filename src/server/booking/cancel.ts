import { db } from "@/lib/db"
import type { CancelledBy } from "@prisma/client"

export async function cancelBookingByToken(token: string, cancelledBy: CancelledBy) {
  const booking = await db.booking.findUnique({ where: { publicToken: token } })
  if (!booking) return null
  if (booking.status === "CANCELLED") return booking

  return db.booking.update({
    where: { id: booking.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelledBy,
    },
  })
}
