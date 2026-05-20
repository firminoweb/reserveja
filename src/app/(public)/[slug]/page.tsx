import Link from "next/link"
import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function EstablishmentPage(props: PageProps<"/[slug]">) {
  const { slug } = await props.params

  const establishment = await db.establishment.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      description: true,
      coverUrl: true,
      logoUrl: true,
      whatsapp: true,
      organization: { select: { status: true } },
      services: {
        where: { active: true },
        select: { id: true, name: true, description: true, durationMin: true, priceCents: true },
        orderBy: { name: "asc" },
      },
    },
  })

  if (!establishment || establishment.organization.status === "SUSPENDED") {
    notFound()
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center gap-4">
        {establishment.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={establishment.logoUrl} alt="" className="size-16 rounded-full object-cover" />
        ) : (
          <div className="size-16 rounded-full bg-muted" />
        )}
        <div>
          <h1 className="text-2xl font-bold">{establishment.name}</h1>
          {establishment.description ? (
            <p className="text-sm text-muted-foreground mt-1">{establishment.description}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button asChild size="lg">
          <Link href={`/${slug}/agendar`}>Agendar horário</Link>
        </Button>
      </div>

      <h2 className="mt-10 text-lg font-semibold">Serviços</h2>
      <div className="mt-4 grid gap-3">
        {establishment.services.map((s) => (
          <Card key={s.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>{s.name}</CardTitle>
                {s.description ? <CardDescription>{s.description}</CardDescription> : null}
              </div>
              <div className="text-right text-sm">
                <div className="font-medium">R$ {(s.priceCents / 100).toFixed(2).replace(".", ",")}</div>
                <div className="text-muted-foreground">{s.durationMin} min</div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Button asChild size="sm" variant="outline">
                <Link href={`/${slug}/agendar?serviceId=${s.id}`}>Agendar</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
