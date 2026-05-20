import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { db } from "@/lib/db"
import { Stepper } from "@/components/booking/stepper"
import { BookingForm } from "@/components/booking/booking-form"
import { formatLocal } from "@/lib/time"

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 items-baseline">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right min-w-0 break-words">{value}</span>
    </div>
  )
}

export default async function AgendarStep3(props: PageProps<"/[slug]/agendar/confirmar">) {
  const { slug } = await props.params
  const sp = (await props.searchParams) as {
    serviceId?: string
    professionalId?: string
    startsAt?: string
  }

  if (!sp.serviceId) redirect(`/${slug}/agendar`)
  if (!sp.professionalId || !sp.startsAt) {
    redirect(`/${slug}/agendar/profissional?serviceId=${sp.serviceId}`)
  }

  const startsAt = new Date(sp.startsAt)
  if (Number.isNaN(startsAt.getTime())) {
    redirect(`/${slug}/agendar/profissional?serviceId=${sp.serviceId}`)
  }

  const establishment = await db.establishment.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      timezone: true,
      organization: { select: { status: true } },
    },
  })
  if (!establishment || establishment.organization.status === "SUSPENDED") notFound()

  const [service, professional, link] = await Promise.all([
    db.service.findFirst({
      where: { id: sp.serviceId, establishmentId: establishment.id, active: true },
      select: { id: true, name: true, durationMin: true, priceCents: true },
    }),
    db.professional.findFirst({
      where: { id: sp.professionalId, establishmentId: establishment.id, active: true },
      select: { id: true, name: true },
    }),
    db.professionalService.findUnique({
      where: {
        professionalId_serviceId: {
          professionalId: sp.professionalId,
          serviceId: sp.serviceId,
        },
      },
    }),
  ])

  if (!service) redirect(`/${slug}/agendar`)
  if (!professional || !link) {
    redirect(`/${slug}/agendar/profissional?serviceId=${sp.serviceId}`)
  }

  return (
    <main className="mx-auto max-w-2xl px-4 md:px-6 py-6 md:py-8">
      <Link
        href={`/${slug}/agendar/profissional?serviceId=${service.id}`}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        ← Trocar horário
      </Link>

      <div className="mt-6">
        <Stepper current={3} />
      </div>

      <h1 className="mt-6 text-2xl font-bold">Confirme seus dados</h1>

      <div className="mt-6 rounded-xl border bg-card p-5 space-y-3 text-sm shadow-sm">
        <SummaryRow label="Serviço" value={service.name} />
        <SummaryRow label="Profissional" value={professional.name} />
        <SummaryRow
          label="Quando"
          value={formatLocal(
            startsAt,
            establishment.timezone,
            "EEEE, dd/MM 'às' HH:mm",
          )}
        />
        <div className="flex justify-between gap-4 border-t pt-3 mt-3 items-baseline">
          <span className="text-muted-foreground shrink-0">Valor</span>
          <span className="font-bold text-base text-primary">
            R$ {(service.priceCents / 100).toFixed(2).replace(".", ",")}
          </span>
        </div>
      </div>

      <BookingForm
        slug={slug}
        serviceId={service.id}
        professionalId={professional.id}
        startsAt={startsAt.toISOString()}
      />
    </main>
  )
}
