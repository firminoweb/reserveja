import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { db } from "@/lib/db"
import { Stepper } from "@/components/booking/stepper"
import { SlotPicker } from "@/components/booking/slot-picker"

export default async function AgendarStep2(props: PageProps<"/[slug]/agendar/profissional">) {
  const { slug } = await props.params
  const { serviceId } = (await props.searchParams) as { serviceId?: string }

  if (!serviceId) redirect(`/${slug}/agendar`)

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

  const service = await db.service.findFirst({
    where: { id: serviceId, establishmentId: establishment.id, active: true },
    select: { id: true, name: true, durationMin: true, priceCents: true },
  })
  if (!service) redirect(`/${slug}/agendar`)

  const professionals = await db.professional.findMany({
    where: {
      establishmentId: establishment.id,
      active: true,
      services: { some: { serviceId: service.id } },
    },
    select: { id: true, name: true, photoUrl: true },
    orderBy: { name: "asc" },
  })

  return (
    <main className="mx-auto max-w-2xl px-4 md:px-6 py-6 md:py-8">
      <Link
        href={`/${slug}/agendar`}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        ← Trocar serviço
      </Link>

      <div className="mt-6">
        <Stepper current={2} />
      </div>

      <h1 className="mt-6 text-2xl font-bold">Escolha um horário</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {service.name} · {service.durationMin} min · R$ {(service.priceCents / 100).toFixed(2).replace(".", ",")}
      </p>

      <SlotPicker
        slug={slug}
        serviceId={service.id}
        timezone={establishment.timezone}
        professionals={professionals}
      />
    </main>
  )
}
