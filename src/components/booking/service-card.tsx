import Link from "next/link"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Props = {
  slug: string
  service: {
    id: string
    name: string
    description: string | null
    durationMin: number
    priceCents: number
  }
}

export function ServiceCard({ slug, service }: Props) {
  return (
    <Link
      href={`/${slug}/agendar/profissional?serviceId=${service.id}`}
      className={cn(
        "block rounded-lg border transition-colors hover:border-foreground hover:bg-muted/40",
      )}
    >
      <Card className="border-0 shadow-none bg-transparent">
        <CardContent className="flex items-start justify-between gap-4 p-5">
          <div className="min-w-0 flex-1">
            <div className="font-medium">{service.name}</div>
            {service.description ? (
              <div className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {service.description}
              </div>
            ) : null}
            <div className="mt-2 text-xs text-muted-foreground">
              {service.durationMin} min
            </div>
          </div>
          <div className="text-right font-medium whitespace-nowrap">
            R$ {(service.priceCents / 100).toFixed(2).replace(".", ",")}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
