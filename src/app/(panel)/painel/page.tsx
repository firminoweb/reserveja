import { CalendarDays, CheckCircle2, Clock } from "lucide-react"

import { requireOwnerMembership } from "@/server/auth/guards"
import { db } from "@/lib/db"
import { formatLocal } from "@/lib/time"
import { Badge } from "@/components/ui/badge"
import { BookingActions } from "@/components/panel/booking-actions"

const STATUS_LABEL = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  NO_SHOW: "Faltou",
} as const

export default async function PanelTodayPage() {
  const { establishment } = await requireOwnerMembership()

  const startOfDay = new Date()
  startOfDay.setUTCHours(0, 0, 0, 0)
  const endOfDay = new Date(startOfDay)
  endOfDay.setUTCDate(endOfDay.getUTCDate() + 1)

  const bookings = await db.booking.findMany({
    where: {
      establishmentId: establishment.id,
      startsAt: { gte: startOfDay, lt: endOfDay },
    },
    include: {
      service: { select: { name: true } },
      professional: { select: { name: true } },
    },
    orderBy: { startsAt: "asc" },
  })

  const pendingCount = bookings.filter(
    (b) => b.status === "PENDING" || b.status === "CONFIRMED",
  ).length
  const completedCount = bookings.filter((b) => b.status === "COMPLETED").length

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Hoje</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatLocal(new Date(), establishment.timezone, "EEEE, dd 'de' MMMM")}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          icon={<CalendarDays className="size-5" />}
          label="Agendamentos"
          value={bookings.length}
        />
        <StatCard
          icon={<Clock className="size-5" />}
          label="Em andamento"
          value={pendingCount}
          tint="primary"
        />
        <StatCard
          icon={<CheckCircle2 className="size-5" />}
          label="Concluídos"
          value={completedCount}
          className="col-span-2 md:col-span-1"
        />
      </div>

      <h2 className="mt-8 text-base font-semibold">Próximos atendimentos</h2>
      <div className="mt-3 divide-y border rounded-xl bg-card shadow-sm">
        {bookings.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">
            Nenhum agendamento hoje.
          </p>
        ) : (
          bookings.map((b) => {
            const finalized = b.status === "CANCELLED" || b.status === "COMPLETED"
            return (
              <div
                key={b.id}
                className="px-4 py-3 sm:px-5 sm:py-4 flex flex-wrap items-center gap-3"
              >
                <div className="rounded-lg bg-primary/10 text-primary px-2.5 py-1.5 text-sm font-semibold tabular-nums shrink-0">
                  {formatLocal(b.startsAt, establishment.timezone, "HH:mm")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span
                      className={`font-medium truncate ${finalized ? "line-through text-muted-foreground" : ""}`}
                    >
                      {b.clientName}
                    </span>
                    {b.status !== "CONFIRMED" && b.status !== "PENDING" ? (
                      <Badge
                        variant={b.status === "COMPLETED" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {STATUS_LABEL[b.status]}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {b.service.name} · {b.professional.name}
                  </div>
                </div>
                <div className="shrink-0">
                  <BookingActions bookingId={b.id} status={b.status} />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  tint,
  className,
}: {
  icon: React.ReactNode
  label: string
  value: number
  tint?: "primary"
  className?: string
}) {
  const tinted = tint === "primary"
  return (
    <div
      className={`rounded-xl border bg-card p-4 shadow-sm flex items-center gap-3 ${className ?? ""}`}
    >
      <div
        className={`flex size-10 items-center justify-center rounded-lg shrink-0 ${
          tinted
            ? "bg-primary text-primary-foreground"
            : "bg-primary/10 text-primary"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground truncate">{label}</div>
        <div className="text-xl font-bold tabular-nums">{value}</div>
      </div>
    </div>
  )
}
