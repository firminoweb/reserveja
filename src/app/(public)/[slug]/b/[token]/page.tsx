import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { formatLocal } from "@/lib/time"
import { CancelBookingButton } from "@/components/booking/cancel-booking-button"
import { cn } from "@/lib/utils"

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  NO_SHOW: "Não compareceu",
  COMPLETED: "Concluído",
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-muted text-muted-foreground",
  NO_SHOW: "bg-rose-100 text-rose-800",
  COMPLETED: "bg-slate-100 text-slate-700",
}

export default async function BookingPage(props: PageProps<"/[slug]/b/[token]">) {
  const { token } = await props.params

  const booking = await db.booking.findUnique({
    where: { publicToken: token },
    include: {
      service: { select: { name: true, durationMin: true, priceCents: true } },
      professional: { select: { name: true } },
      establishment: { select: { name: true, timezone: true, whatsapp: true } },
    },
  })

  if (!booking) notFound()

  const tz = booking.establishment.timezone
  const cancellable = booking.status === "CONFIRMED" || booking.status === "PENDING"

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <h1 className="text-2xl font-bold">{booking.establishment.name}</h1>

      <div className="mt-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
            STATUS_COLOR[booking.status],
          )}
        >
          {STATUS_LABEL[booking.status]}
          {booking.status === "CANCELLED" && booking.cancelledAt ? (
            <> · {formatLocal(booking.cancelledAt, tz, "dd/MM 'às' HH:mm")}</>
          ) : null}
        </span>
      </div>

      <div className="mt-6 rounded-lg border p-5 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Serviço</span>
          <span className="font-medium">{booking.service.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Profissional</span>
          <span className="font-medium">{booking.professional.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Quando</span>
          <span className="font-medium text-right">
            {formatLocal(booking.startsAt, tz, "EEEE, dd/MM 'às' HH:mm")}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cliente</span>
          <span className="font-medium">{booking.clientName}</span>
        </div>
        <div className="flex justify-between border-t pt-2 mt-3">
          <span className="text-muted-foreground">Valor</span>
          <span className="font-semibold">
            R$ {(booking.service.priceCents / 100).toFixed(2).replace(".", ",")}
          </span>
        </div>
      </div>

      {cancellable ? (
        <div className="mt-6">
          <CancelBookingButton token={booking.publicToken} />
        </div>
      ) : null}
    </main>
  )
}
