import { db } from "@/lib/db"

const DAY_MS = 24 * 60 * 60 * 1000

export type DashboardData = {
  totals: {
    organizations: number
    activeOrganizations: number
    suspendedOrganizations: number
    establishments: number
    users: number
    bookings: number
  }
  trends: {
    bookingsLast7Days: number
    bookingsPrev7Days: number
    newOrgsLast30Days: number
    cancelRateLast30Days: number // 0..1
  }
  bookingsByDay: { date: string; count: number }[] // últimos 14 dias
  newOrgsByWeek: { weekStartIso: string; label: string; count: number }[] // últimas 8 semanas
  topEstablishments: {
    id: string
    name: string
    organizationName: string
    bookingCount: number
  }[]
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DAY_MS)
}

function startOfDayUtc(d: Date): Date {
  const x = new Date(d)
  x.setUTCHours(0, 0, 0, 0)
  return x
}

function startOfWeekUtc(d: Date): Date {
  const x = startOfDayUtc(d)
  const day = x.getUTCDay() // 0=Sun
  const diff = day === 0 ? 6 : day - 1 // segunda como início
  return addDays(x, -diff)
}

export async function getAdminDashboard(): Promise<DashboardData> {
  const now = new Date()
  const today = startOfDayUtc(now)
  const last7Start = addDays(today, -6)
  const prev7Start = addDays(today, -13)
  const last14Start = addDays(today, -13)
  const last30Start = addDays(today, -29)
  const last8WeeksStart = startOfWeekUtc(addDays(today, -49))

  const [
    organizations,
    activeOrganizations,
    suspendedOrganizations,
    establishments,
    users,
    bookings,
    bookingsLast7,
    bookingsPrev7,
    newOrgsLast30,
    bookingsLast14List,
    newOrgsLast8WeeksList,
    cancelledLast30,
    totalLast30,
    topEstablishmentsRaw,
  ] = await Promise.all([
    db.organization.count(),
    db.organization.count({ where: { status: "ACTIVE" } }),
    db.organization.count({ where: { status: "SUSPENDED" } }),
    db.establishment.count(),
    db.user.count(),
    db.booking.count(),
    db.booking.count({
      where: { startsAt: { gte: last7Start, lt: addDays(today, 1) } },
    }),
    db.booking.count({
      where: { startsAt: { gte: prev7Start, lt: last7Start } },
    }),
    db.organization.count({
      where: { createdAt: { gte: last30Start } },
    }),
    db.booking.findMany({
      where: { startsAt: { gte: last14Start, lt: addDays(today, 1) } },
      select: { startsAt: true },
    }),
    db.organization.findMany({
      where: { createdAt: { gte: last8WeeksStart } },
      select: { createdAt: true },
    }),
    db.booking.count({
      where: {
        startsAt: { gte: last30Start, lt: addDays(today, 1) },
        status: "CANCELLED",
      },
    }),
    db.booking.count({
      where: { startsAt: { gte: last30Start, lt: addDays(today, 1) } },
    }),
    db.booking.groupBy({
      by: ["establishmentId"],
      where: { startsAt: { gte: last30Start, lt: addDays(today, 1) } },
      _count: { _all: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
  ])

  // bookingsByDay — preenche 14 dias com 0
  const byDay = new Map<string, number>()
  for (let i = 0; i < 14; i++) {
    byDay.set(dateKey(addDays(last14Start, i)), 0)
  }
  for (const b of bookingsLast14List) {
    const k = dateKey(startOfDayUtc(b.startsAt))
    if (byDay.has(k)) byDay.set(k, (byDay.get(k) ?? 0) + 1)
  }

  // newOrgsByWeek — 8 semanas
  const byWeek = new Map<string, number>()
  for (let i = 0; i < 8; i++) {
    byWeek.set(dateKey(addDays(last8WeeksStart, i * 7)), 0)
  }
  for (const o of newOrgsLast8WeeksList) {
    const k = dateKey(startOfWeekUtc(o.createdAt))
    if (byWeek.has(k)) byWeek.set(k, (byWeek.get(k) ?? 0) + 1)
  }

  const topIds = topEstablishmentsRaw.map((t) => t.establishmentId)
  const topEstabs = await db.establishment.findMany({
    where: { id: { in: topIds } },
    select: {
      id: true,
      name: true,
      organization: { select: { name: true } },
    },
  })
  const topMap = new Map(topEstabs.map((e) => [e.id, e]))

  return {
    totals: {
      organizations,
      activeOrganizations,
      suspendedOrganizations,
      establishments,
      users,
      bookings,
    },
    trends: {
      bookingsLast7Days: bookingsLast7,
      bookingsPrev7Days: bookingsPrev7,
      newOrgsLast30Days: newOrgsLast30,
      cancelRateLast30Days:
        totalLast30 > 0 ? cancelledLast30 / totalLast30 : 0,
    },
    bookingsByDay: Array.from(byDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count })),
    newOrgsByWeek: Array.from(byWeek.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([weekStartIso, count]) => {
        const d = new Date(weekStartIso + "T00:00:00Z")
        const label = `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`
        return { weekStartIso, label, count }
      }),
    topEstablishments: topEstablishmentsRaw
      .map((t) => {
        const e = topMap.get(t.establishmentId)
        if (!e) return null
        return {
          id: e.id,
          name: e.name,
          organizationName: e.organization.name,
          bookingCount: t._count._all,
        }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null),
  }
}
