import { addMinutes } from "date-fns"

import { db } from "@/lib/db"
import {
  localMinutes,
  localWeekday,
  minutesToUtc,
  parseLocalDateString,
} from "@/lib/time"

const SLOT_GRANULARITY_MIN = 15

type GetAvailabilityArgs = {
  establishmentSlug: string
  serviceId: string
  professionalId?: string
  date: string // YYYY-MM-DD no fuso do estabelecimento
}

type Slot = {
  startsAt: string // ISO UTC
  endsAt: string   // ISO UTC
  professionalId: string
}

/**
 * Retorna slots disponíveis para um serviço numa data.
 *
 * Algoritmo:
 *  1. Resolve estabelecimento + serviço + profissionais elegíveis
 *  2. Para cada profissional, determina janela de trabalho (override > estab)
 *  3. Gera slots de N min dentro da janela que comportem o durationMin do serviço
 *  4. Remove slots que colidem com bookings ativos ou time blocks
 */
export async function getAvailability(args: GetAvailabilityArgs): Promise<Slot[]> {
  const establishment = await db.establishment.findUnique({
    where: { slug: args.establishmentSlug },
    select: { id: true, timezone: true },
  })
  if (!establishment) return []

  const service = await db.service.findFirst({
    where: { id: args.serviceId, establishmentId: establishment.id, active: true },
    select: { id: true, durationMin: true },
  })
  if (!service) return []

  const professionals = await db.professional.findMany({
    where: {
      establishmentId: establishment.id,
      active: true,
      ...(args.professionalId ? { id: args.professionalId } : {}),
      services: { some: { serviceId: service.id } },
    },
    include: { schedules: true },
  })
  if (professionals.length === 0) return []

  const tz = establishment.timezone
  const dayUtcStart = parseLocalDateString(args.date, tz)
  const dayUtcEnd = addMinutes(dayUtcStart, 24 * 60)
  const weekday = localWeekday(dayUtcStart, tz)

  const estabWorkingHours = await db.workingHour.findMany({
    where: { establishmentId: establishment.id, weekday },
  })

  const [bookings, blocks] = await Promise.all([
    db.booking.findMany({
      where: {
        professionalId: { in: professionals.map((p) => p.id) },
        status: { in: ["PENDING", "CONFIRMED"] },
        startsAt: { lt: dayUtcEnd },
        endsAt: { gt: dayUtcStart },
      },
      select: { professionalId: true, startsAt: true, endsAt: true },
    }),
    db.timeBlock.findMany({
      where: {
        OR: [
          { establishmentId: establishment.id, professionalId: null },
          { professionalId: { in: professionals.map((p) => p.id) } },
        ],
        startsAt: { lt: dayUtcEnd },
        endsAt: { gt: dayUtcStart },
      },
      select: { professionalId: true, startsAt: true, endsAt: true },
    }),
  ])

  const slots: Slot[] = []

  for (const pro of professionals) {
    const schedules = pro.schedules.filter((s) => s.weekday === weekday)
    const windows = schedules.length > 0
      ? schedules
      : estabWorkingHours

    for (const window of windows) {
      const windowStartUtc = minutesToUtc(dayUtcStart, window.startMin, tz)
      const windowEndUtc = minutesToUtc(dayUtcStart, window.endMin, tz)

      let cursor = windowStartUtc
      while (addMinutes(cursor, service.durationMin) <= windowEndUtc) {
        const slotStart = cursor
        const slotEnd = addMinutes(cursor, service.durationMin)

        const conflictsBooking = bookings.some(
          (b) =>
            b.professionalId === pro.id &&
            b.startsAt < slotEnd &&
            b.endsAt > slotStart,
        )
        const conflictsBlock = blocks.some(
          (bl) =>
            (bl.professionalId === pro.id || bl.professionalId === null) &&
            bl.startsAt < slotEnd &&
            bl.endsAt > slotStart,
        )

        if (!conflictsBooking && !conflictsBlock) {
          slots.push({
            professionalId: pro.id,
            startsAt: slotStart.toISOString(),
            endsAt: slotEnd.toISOString(),
          })
        }

        cursor = addMinutes(cursor, SLOT_GRANULARITY_MIN)
      }
    }
  }

  return slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt))
}

// re-export pra deixar explícito que o consumidor não precisa importar de lugares diferentes
export { localMinutes }
