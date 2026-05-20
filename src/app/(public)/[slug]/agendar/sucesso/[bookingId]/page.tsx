import Link from "next/link"
import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { formatLocal } from "@/lib/time"

export default async function AgendarSucesso(
  props: PageProps<"/[slug]/agendar/sucesso/[bookingId]">,
) {
  const { slug, bookingId } = await props.params

  const booking = await db.booking.findFirst({
    where: { id: bookingId, establishment: { slug } },
    include: {
      service: { select: { name: true } },
      professional: { select: { name: true } },
      establishment: { select: { name: true, timezone: true, whatsapp: true } },
    },
  })

  if (!booking) notFound()

  const tz = booking.establishment.timezone
  const waNumber = booking.establishment.whatsapp.replace(/\D/g, "")

  return (
    <main className="mx-auto max-w-xl px-4 md:px-6 py-8 md:py-12 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-2xl">
        ✓
      </div>
      <h1 className="mt-6 text-3xl font-bold">Tudo certo, {booking.clientName.split(" ")[0]}!</h1>
      <p className="mt-2 text-muted-foreground">
        Seu horário em {booking.establishment.name} está reservado.
      </p>

      <div className="mt-8 rounded-xl border bg-card p-5 text-left text-sm space-y-3 shadow-sm">
        <div className="flex justify-between gap-4 items-baseline">
          <span className="text-muted-foreground shrink-0">Serviço</span>
          <span className="font-medium text-right min-w-0 break-words">
            {booking.service.name}
          </span>
        </div>
        <div className="flex justify-between gap-4 items-baseline">
          <span className="text-muted-foreground shrink-0">Profissional</span>
          <span className="font-medium text-right min-w-0 break-words">
            {booking.professional.name}
          </span>
        </div>
        <div className="flex justify-between gap-4 items-baseline">
          <span className="text-muted-foreground shrink-0">Quando</span>
          <span className="font-medium text-right min-w-0 break-words">
            {formatLocal(booking.startsAt, tz, "EEEE, dd/MM 'às' HH:mm")}
          </span>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Button asChild className="w-full" size="lg">
          <Link href={`/${slug}/b/${booking.publicToken}`}>Ver meu agendamento</Link>
        </Button>
        {waNumber ? (
          <Button asChild variant="outline" className="w-full" size="lg">
            <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer">
              Falar com o salão no WhatsApp
            </a>
          </Button>
        ) : null}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Guarde o link acima — você pode cancelar por lá se precisar.
      </p>
    </main>
  )
}
