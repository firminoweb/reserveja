import type { BookingStatus } from "@prisma/client"

import { db } from "@/lib/db"

export type HistoryBooking = {
  id: string
  startsAtIso: string
  endsAtIso: string
  status: BookingStatus
  clientName: string
  clientPhone: string
  serviceName: string
  servicePriceCents: number
  professionalName: string
}

export type HistoryMetrics = {
  total: number
  completed: number
  cancelled: number
  noShow: number
  revenueCents: number
}

export type HistoryFilters = {
  fromUtc: Date
  toUtc: Date
  professionalId: string | null
  statuses: BookingStatus[]
}

export async function listBookingHistory(
  establishmentId: string,
  filters: HistoryFilters,
): Promise<{ bookings: HistoryBooking[]; metrics: HistoryMetrics }> {
  const bookings = await db.booking.findMany({
    where: {
      establishmentId,
      startsAt: { gte: filters.fromUtc, lt: filters.toUtc },
      ...(filters.statuses.length > 0 ? { status: { in: filters.statuses } } : {}),
      ...(filters.professionalId ? { professionalId: filters.professionalId } : {}),
    },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      status: true,
      clientName: true,
      clientPhone: true,
      service: { select: { name: true, priceCents: true } },
      professional: { select: { name: true } },
    },
    orderBy: { startsAt: "desc" },
  })

  let completed = 0
  let cancelled = 0
  let noShow = 0
  let revenueCents = 0

  for (const b of bookings) {
    if (b.status === "COMPLETED") {
      completed++
      revenueCents += b.service.priceCents
    } else if (b.status === "CANCELLED") {
      cancelled++
    } else if (b.status === "NO_SHOW") {
      noShow++
    }
  }

  return {
    bookings: bookings.map((b) => ({
      id: b.id,
      startsAtIso: b.startsAt.toISOString(),
      endsAtIso: b.endsAt.toISOString(),
      status: b.status,
      clientName: b.clientName,
      clientPhone: b.clientPhone,
      serviceName: b.service.name,
      servicePriceCents: b.service.priceCents,
      professionalName: b.professional.name,
    })),
    metrics: {
      total: bookings.length,
      completed,
      cancelled,
      noShow,
      revenueCents,
    },
  }
}
