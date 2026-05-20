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

  return (
    <div className="px-8 py-8">
      <h1 className="text-2xl font-bold">Hoje</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {pendingCount} ativo(s) de {bookings.length}
      </p>

      <div className="mt-8 divide-y border rounded-lg">
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
                className="px-5 py-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-medium ${finalized ? "line-through text-muted-foreground" : ""}`}
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
                  <div className="text-xs text-muted-foreground">
                    {b.service.name} · {b.professional.name}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-sm font-medium tabular-nums">
                    {formatLocal(b.startsAt, establishment.timezone, "HH:mm")}
                  </div>
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
