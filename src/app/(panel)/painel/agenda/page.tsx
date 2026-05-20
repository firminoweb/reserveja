import { addDays, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toZonedTime } from "date-fns-tz"

import { requireOwnerMembership } from "@/server/auth/guards"
import { db } from "@/lib/db"
import {
  assignLanes,
  getWeekRange,
  splitBlocksByDay,
  weekDaysLocal,
  workingHoursMinuteRange,
} from "@/lib/agenda-week"
import { formatLocal, localMinutes } from "@/lib/time"
import {
  WeekAgenda,
  type AgendaBooking,
  type AgendaDay,
} from "@/components/panel/week-agenda"

type Search = {
  anchor?: string | string[]
  professionalId?: string | string[]
}

function parseAnchor(value: string | undefined): Date {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00Z`)
  }
  return new Date()
}

function singleParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export default async function PanelAgendaPage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const { establishment } = await requireOwnerMembership()
  const tz = establishment.timezone

  const sp = await searchParams
  const anchor = parseAnchor(singleParam(sp.anchor))
  const professionalIdParam = singleParam(sp.professionalId)

  const { startUtc, endUtc, startLocal } = getWeekRange(anchor, tz)
  const days = weekDaysLocal(startLocal)

  const professionals = await db.professional.findMany({
    where: { establishmentId: establishment.id, active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  const professionalFilter =
    professionalIdParam && professionals.some((p) => p.id === professionalIdParam)
      ? professionalIdParam
      : null

  const [bookings, workingHours, blocks] = await Promise.all([
    db.booking.findMany({
      where: {
        establishmentId: establishment.id,
        startsAt: { gte: startUtc, lt: endUtc },
        status: { not: "CANCELLED" },
        ...(professionalFilter ? { professionalId: professionalFilter } : {}),
      },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        clientName: true,
        clientPhone: true,
        status: true,
        notes: true,
        professionalId: true,
        professional: { select: { name: true } },
        service: { select: { name: true } },
      },
      orderBy: { startsAt: "asc" },
    }),
    db.workingHour.findMany({
      where: { establishmentId: establishment.id },
      select: { startMin: true, endMin: true },
    }),
    db.timeBlock.findMany({
      where: {
        establishmentId: establishment.id,
        startsAt: { lt: endUtc },
        endsAt: { gt: startUtc },
        ...(professionalFilter
          ? { OR: [{ professionalId: professionalFilter }, { professionalId: null }] }
          : {}),
      },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        reason: true,
        professional: { select: { id: true, name: true } },
      },
    }),
  ])

  const blocksByDay = splitBlocksByDay(blocks, days, tz)

  const { startMin, endMin } = workingHoursMinuteRange(workingHours)
  const startHour = Math.floor(startMin / 60)
  const endHour = Math.ceil(endMin / 60)

  const todayLocal = toZonedTime(new Date(), tz)
  const todayKey = format(todayLocal, "yyyy-MM-dd")

  // Agrupa bookings por dia local
  const byDay = new Map<string, typeof bookings>()
  for (const b of bookings) {
    const key = formatLocal(b.startsAt, tz, "yyyy-MM-dd")
    const arr = byDay.get(key) ?? []
    arr.push(b)
    byDay.set(key, arr)
  }

  const agendaDays: AgendaDay[] = days.map((day) => {
    const key = format(day, "yyyy-MM-dd")
    const items = byDay.get(key) ?? []
    const { items: laned, totalLanes } = assignLanes(
      items.map((b) => ({ ...b, startsAt: b.startsAt, endsAt: b.endsAt })),
    )
    const bookingsOut: AgendaBooking[] = laned.map((b) => ({
      id: b.id,
      localStartMin: localMinutes(b.startsAt, tz),
      localEndMin: localMinutes(b.endsAt, tz),
      startLabel: formatLocal(b.startsAt, tz, "HH:mm"),
      endLabel: formatLocal(b.endsAt, tz, "HH:mm"),
      clientName: b.clientName,
      clientPhone: b.clientPhone,
      serviceName: b.service.name,
      professionalId: b.professionalId,
      professionalName: b.professional.name,
      status: b.status,
      notes: b.notes,
      lane: b.lane,
    }))

    return {
      dateIso: key,
      dayLabel: format(day, "dd/MM"),
      weekdayLabel: format(day, "EEE", { locale: ptBR }),
      isToday: key === todayKey,
      totalLanes,
      bookings: bookingsOut,
      blocks: blocksByDay.get(key) ?? [],
    }
  })

  const prevAnchor = format(addDays(startLocal, -7), "yyyy-MM-dd")
  const nextAnchor = format(addDays(startLocal, 7), "yyyy-MM-dd")
  const todayAnchor = todayKey
  const weekStartIso = format(startLocal, "yyyy-MM-dd")
  const weekEndIso = format(addDays(startLocal, 6), "dd/MM/yyyy")
  const rangeLabel = `${format(startLocal, "dd/MM")} — ${weekEndIso}`

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <WeekAgenda
        weekStartIso={weekStartIso}
        prevAnchor={prevAnchor}
        nextAnchor={nextAnchor}
        todayAnchor={todayAnchor}
        rangeLabel={rangeLabel}
        days={agendaDays}
        startHour={startHour}
        endHour={endHour}
        professionals={professionals}
        selectedProfessionalId={professionalFilter}
        establishmentTimezone={tz}
      />
    </div>
  )
}
