"use client"

import { useMemo, useState } from "react"
import { CalendarDays, MessageCircle, Phone, Search, User } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { formatNationalBR } from "@/lib/phone"
import type { ClientSummary } from "@/server/clients/list"

type Props = {
  clients: ClientSummary[]
  timezone: string
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  NO_SHOW: "Não compareceu",
}

function formatBRL(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`
}

function formatDate(iso: string, timezone: string, withTime = false): string {
  const d = new Date(iso)
  return d.toLocaleDateString("pt-BR", {
    timeZone: timezone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  })
}

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
}

export function ClientsPanel({ clients, timezone }: Props) {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<ClientSummary | null>(null)

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return clients
    return clients.filter((c) => {
      const name = normalize(c.name)
      const phoneDigits = c.phone.replace(/\D/g, "")
      const qDigits = q.replace(/\D/g, "")
      return (
        name.includes(q) ||
        (qDigits.length >= 3 && phoneDigits.includes(qDigits))
      )
    })
  }, [clients, query])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="Buscar por nome ou telefone"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {clients.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          Ainda não há clientes — eles aparecem aqui automaticamente conforme
          agendamentos são feitos.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          Nenhum cliente encontrado para &ldquo;{query}&rdquo;.
        </div>
      ) : (
        <div className="grid gap-2">
          {filtered.map((c) => (
            <button
              key={c.phone}
              type="button"
              onClick={() => setSelected(c)}
              className="text-left rounded-lg border bg-card p-3 sm:p-4 hover:border-primary/40 hover:bg-primary/5 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
            >
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center shrink-0">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="font-medium truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground shrink-0">
                      {c.totalBookings} {c.totalBookings === 1 ? "visita" : "visitas"}
                    </div>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground truncate">
                    {formatNationalBR(c.phone)}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="text-muted-foreground">
                      Última: {formatDate(c.lastVisitIso, timezone)}
                    </span>
                    {c.revenueCents > 0 ? (
                      <span className="font-medium text-primary">
                        {formatBRL(c.revenueCents)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col gap-0">
          {selected ? (
            <>
              <SheetHeader className="px-5 pt-5 pb-4 border-b">
                <SheetTitle className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center shrink-0">
                    {selected.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{selected.name}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      {formatNationalBR(selected.phone)}
                    </div>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="px-5 py-4 border-b grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-xs text-muted-foreground">Visitas</div>
                  <div className="mt-0.5 text-lg font-bold">
                    {selected.totalBookings}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Concluídas</div>
                  <div className="mt-0.5 text-lg font-bold">
                    {selected.completedBookings}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Receita</div>
                  <div className="mt-0.5 text-lg font-bold text-primary">
                    {selected.revenueCents > 0
                      ? formatBRL(selected.revenueCents)
                      : "—"}
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 border-b text-xs text-muted-foreground space-y-1">
                {selected.favoriteServiceName ? (
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" aria-hidden />
                    Serviço preferido:{" "}
                    <span className="text-foreground font-medium">
                      {selected.favoriteServiceName}
                    </span>
                  </div>
                ) : null}
                {selected.favoriteProfessionalName ? (
                  <div className="flex items-center gap-1.5">
                    <User className="size-3.5" aria-hidden />
                    Profissional preferido:{" "}
                    <span className="text-foreground font-medium">
                      {selected.favoriteProfessionalName}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="px-5 py-3 border-b flex gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <a
                    href={`https://wa.me/${selected.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="size-4" />
                    WhatsApp
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <a href={`tel:${selected.phone}`}>
                    <Phone className="size-4" />
                    Ligar
                  </a>
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                <h3 className="text-sm font-semibold mb-3">
                  Histórico ({selected.bookings.length})
                </h3>
                <ul className="space-y-2">
                  {selected.bookings.map((b) => (
                    <li
                      key={b.id}
                      className={cn(
                        "rounded-md border bg-card p-3 text-sm",
                        b.status === "CANCELLED" && "opacity-70",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">
                            {b.serviceName}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {b.professionalName}
                          </div>
                        </div>
                        <Badge
                          variant={
                            b.status === "COMPLETED" ? "default" : "secondary"
                          }
                          className="shrink-0"
                        >
                          {STATUS_LABEL[b.status]}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span
                          className={cn(
                            b.status === "CANCELLED" && "line-through",
                          )}
                        >
                          {formatDate(b.startsAtIso, timezone, true)}
                        </span>
                        <span className="font-medium text-foreground">
                          {formatBRL(b.servicePriceCents)}
                        </span>
                      </div>
                      {b.notes ? (
                        <div className="mt-2 text-xs text-muted-foreground border-t pt-2">
                          {b.notes}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
