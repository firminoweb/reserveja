import Link from "next/link"
import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { Stepper } from "@/components/booking/stepper"
import { ServiceCard } from "@/components/booking/service-card"

export default async function AgendarStep1(props: PageProps<"/[slug]/agendar">) {
  const { slug } = await props.params

  const establishment = await db.establishment.findUnique({
    where: { slug },
    select: {
      name: true,
      organization: { select: { status: true } },
      services: {
        where: { active: true },
        select: { id: true, name: true, description: true, durationMin: true, priceCents: true },
        orderBy: { name: "asc" },
      },
    },
  })

  if (!establishment || establishment.organization.status === "SUSPENDED") notFound()

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <Link href={`/${slug}`} className="text-xs text-muted-foreground hover:text-foreground">
        ← Voltar para {establishment.name}
      </Link>

      <div className="mt-6">
        <Stepper current={1} />
      </div>

      <h1 className="mt-6 text-2xl font-bold">Escolha o serviço</h1>

      {establishment.services.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          Este salão ainda não cadastrou serviços. Volte mais tarde.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {establishment.services.map((s) => (
            <ServiceCard key={s.id} slug={slug} service={s} />
          ))}
        </div>
      )}
    </main>
  )
}
