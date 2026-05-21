import type { BookingStatus } from "@prisma/client"

import { db } from "@/lib/db"

export type ClientBooking = {
  id: string
  startsAtIso: string
  endsAtIso: string
  status: BookingStatus
  serviceName: string
  servicePriceCents: number
  professionalName: string
  notes: string | null
}

export type ClientSummary = {
  phone: string
  name: string
  totalBookings: number
  completedBookings: number
  cancelledBookings: number
  noShowBookings: number
  revenueCents: number
  lastVisitIso: string
  favoriteServiceName: string | null
  favoriteProfessionalName: string | null
  bookings: ClientBooking[]
}

/**
 * Agrega bookings por clientPhone do estabelecimento. "Cliente" no Reserve Já
 * é uma view derivada — não tem modelo próprio. Mesmo telefone = mesma pessoa
 * (índice em Booking.clientPhone). Nome usado é o mais recente.
 */
export async function listClientsForEstablishment(
  establishmentId: string,
): Promise<ClientSummary[]> {
  const bookings = await db.booking.findMany({
    where: { establishmentId },
    select: {
      id: true,
      clientName: true,
      clientPhone: true,
      startsAt: true,
      endsAt: true,
      status: true,
      notes: true,
      service: { select: { name: true, priceCents: true } },
      professional: { select: { name: true } },
    },
    orderBy: { startsAt: "desc" },
  })

  const byPhone = new Map<string, typeof bookings>()
  for (const b of bookings) {
    const arr = byPhone.get(b.clientPhone) ?? []
    arr.push(b)
    byPhone.set(b.clientPhone, arr)
  }

  const summaries: ClientSummary[] = []
  for (const [phone, items] of byPhone) {
    // items já vêm em ordem desc por startsAt
    const latest = items[0]
    let completed = 0
    let cancelled = 0
    let noShow = 0
    let revenueCents = 0
    const serviceFreq = new Map<string, number>()
    const profFreq = new Map<string, number>()

    for (const b of items) {
      if (b.status === "COMPLETED") {
        completed++
        revenueCents += b.service.priceCents
      } else if (b.status === "CANCELLED") {
        cancelled++
      } else if (b.status === "NO_SHOW") {
        noShow++
      }
      serviceFreq.set(b.service.name, (serviceFreq.get(b.service.name) ?? 0) + 1)
      profFreq.set(b.professional.name, (profFreq.get(b.professional.name) ?? 0) + 1)
    }

    summaries.push({
      phone,
      name: latest.clientName,
      totalBookings: items.length,
      completedBookings: completed,
      cancelledBookings: cancelled,
      noShowBookings: noShow,
      revenueCents,
      lastVisitIso: latest.startsAt.toISOString(),
      favoriteServiceName: topKey(serviceFreq),
      favoriteProfessionalName: topKey(profFreq),
      bookings: items.map((b) => ({
        id: b.id,
        startsAtIso: b.startsAt.toISOString(),
        endsAtIso: b.endsAt.toISOString(),
        status: b.status,
        serviceName: b.service.name,
        servicePriceCents: b.service.priceCents,
        professionalName: b.professional.name,
        notes: b.notes,
      })),
    })
  }

  // Ordena por última visita (mais recente primeiro)
  summaries.sort((a, b) => b.lastVisitIso.localeCompare(a.lastVisitIso))
  return summaries
}

function topKey(freq: Map<string, number>): string | null {
  let best: string | null = null
  let bestCount = 0
  for (const [k, v] of freq) {
    if (v > bestCount) {
      best = k
      bestCount = v
    }
  }
  return best
}
