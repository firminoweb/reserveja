import Link from "next/link"
import { notFound } from "next/navigation"
import { MapPin } from "lucide-react"

import { db } from "@/lib/db"
import { formatAddressLines, googleMapsUrl, hasAddress } from "@/lib/address"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShareContacts } from "@/components/establishment/share-contacts"

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
      instagram: true,
      facebook: true,
      tiktok: true,
      youtube: true,
      street: true,
      streetNumber: true,
      complement: true,
      neighborhood: true,
      city: true,
      state: true,
      cep: true,
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
    <main className="mx-auto max-w-3xl px-4 md:px-6 py-6 md:py-10">
      <div className="flex items-center gap-3 md:gap-4">
        {establishment.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={establishment.logoUrl}
            alt=""
            className="size-14 md:size-16 rounded-full object-cover"
          />
        ) : (
          <div className="size-14 md:size-16 rounded-full bg-muted" />
        )}
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold truncate">
            {establishment.name}
          </h1>
          {establishment.description ? (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {establishment.description}
            </p>
          ) : null}
        </div>
      </div>

      <ShareContacts
        slug={slug}
        name={establishment.name}
        whatsapp={establishment.whatsapp}
        instagram={establishment.instagram}
        facebook={establishment.facebook}
        tiktok={establishment.tiktok}
        youtube={establishment.youtube}
      />

      {hasAddress(establishment) ? (
        <div className="mt-6 rounded-lg border bg-muted/30 px-4 py-3 flex items-start gap-3">
          <MapPin className="size-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1 text-sm">
            {formatAddressLines(establishment).map((line, i) => (
              <div
                key={i}
                className={i === 0 ? "font-medium" : "text-muted-foreground"}
              >
                {line}
              </div>
            ))}
            {googleMapsUrl(establishment) ? (
              <a
                href={googleMapsUrl(establishment)!}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-xs underline text-primary"
              >
                Abrir no Google Maps
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-6 md:mt-8 flex sm:justify-end">
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href={`/${slug}/agendar`}>Agendar horário</Link>
        </Button>
      </div>

      <h2 className="mt-8 md:mt-10 text-lg font-semibold">Serviços</h2>
      <div className="mt-4 grid gap-3">
        {establishment.services.map((s) => (
          <Card key={s.id} className="border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <div className="min-w-0 flex-1">
                <CardTitle className="truncate text-base">{s.name}</CardTitle>
                {s.description ? (
                  <CardDescription className="line-clamp-2 mt-1">
                    {s.description}
                  </CardDescription>
                ) : null}
              </div>
              <div className="text-right text-sm shrink-0">
                <div className="font-bold text-primary text-base">
                  R$ {(s.priceCents / 100).toFixed(2).replace(".", ",")}
                </div>
                <div className="text-xs text-muted-foreground">
                  {s.durationMin} min
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                asChild
                size="sm"
                className="w-full sm:w-auto"
              >
                <Link href={`/${slug}/agendar/profissional?serviceId=${s.id}`}>
                  Agendar este serviço
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

    </main>
  )
}
