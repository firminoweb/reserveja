import Link from "next/link"
import { ChevronRight, Clock } from "lucide-react"

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
        "group block rounded-xl border bg-card shadow-sm transition-all",
        "hover:border-primary/40 hover:shadow-md hover:-translate-y-px",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
      )}
    >
      <Card className="border-0 shadow-none bg-transparent">
        <CardContent className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5">
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-base">{service.name}</div>
            {service.description ? (
              <div className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {service.description}
              </div>
            ) : null}
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5" aria-hidden />
              {service.durationMin} min
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right whitespace-nowrap">
              <div className="text-base font-bold text-primary">
                R$ {(service.priceCents / 100).toFixed(2).replace(".", ",")}
              </div>
            </div>
            <ChevronRight
              className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
              aria-hidden
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
