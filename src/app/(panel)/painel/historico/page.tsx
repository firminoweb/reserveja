import { CheckCircle2, MessageCircle, TrendingUp, XCircle, UserX } from "lucide-react"
import type { BookingStatus } from "@prisma/client"

import { requireOwnerMembership } from "@/server/auth/guards"
import { db } from "@/lib/db"
import { formatLocal, parseLocalDateString } from "@/lib/time"
import { formatNationalBR } from "@/lib/phone"
import { listBookingHistory } from "@/server/bookings/history"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { HistoryFilters } from "@/components/panel/history-filters"

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  NO_SHOW: "Não compareceu",
}

const VALID_STATUSES: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]
const DEFAULT_STATUSES: BookingStatus[] = ["COMPLETED", "CANCELLED", "NO_SHOW"]

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function parseStatuses(input: string | undefined): BookingStatus[] {
  if (!input) return DEFAULT_STATUSES
  const parts = input.split(",").map((s) => s.trim()) as BookingStatus[]
  const valid = parts.filter((p) => VALID_STATUSES.includes(p))
  return valid.length > 0 ? valid : DEFAULT_STATUSES
}

function formatBRL(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`
}

type Search = {
  from?: string | string[]
  to?: string | string[]
  professionalId?: string | string[]
  status?: string | string[]
}

function singleParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export default async function PanelHistoricoPage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const { establishment } = await requireOwnerMembership()
  const tz = establishment.timezone
  const sp = await searchParams

  // Defaults: últimos 30 dias
  const now = new Date()
  const defaultTo = isoDate(now)
  const defaultFrom = isoDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000))

  const fromStr = singleParam(sp.from) || defaultFrom
  const toStr = singleParam(sp.to) || defaultTo
  const professionalIdParam = singleParam(sp.professionalId)
  const statuses = parseStatuses(singleParam(sp.status))

  // Converte datas locais (yyyy-MM-dd no fuso do estab) pra UTC.
  // `to` é inclusivo no dia → somamos 1 dia ao limite superior.
  const fromUtc = parseLocalDateString(fromStr, tz)
  const toUtcExclusive = parseLocalDateString(
    isoDate(new Date(parseLocalDateString(toStr, tz).getTime() + 24 * 60 * 60 * 1000)),
    tz,
  )

  const professionals = await db.professional.findMany({
    where: { establishmentId: establishment.id },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  const professionalFilter =
    professionalIdParam && professionals.some((p) => p.id === professionalIdParam)
      ? professionalIdParam
      : null

  const { bookings, metrics } = await listBookingHistory(establishment.id, {
    fromUtc,
    toUtc: toUtcExclusive,
    professionalId: professionalFilter,
    statuses,
  })

  const kpis = [
    {
      label: "Receita",
      value: formatBRL(metrics.revenueCents),
      icon: TrendingUp,
      tone: "text-primary",
    },
    {
      label: "Concluídos",
      value: String(metrics.completed),
      icon: CheckCircle2,
      tone: "text-emerald-600",
    },
    {
      label: "Cancelados",
      value: String(metrics.cancelled),
      icon: XCircle,
      tone: "text-rose-600",
    },
    {
      label: "Não compareceu",
      value: String(metrics.noShow),
      icon: UserX,
      tone: "text-amber-600",
    },
  ]

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">Histórico</h1>
        <span className="text-sm text-muted-foreground">
          {metrics.total}{" "}
          {metrics.total === 1 ? "agendamento" : "agendamentos"}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Análise dos atendimentos passados — receita, taxa de cancelamento e
        ausências.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-xl border bg-card p-4 flex items-center gap-3"
          >
            <div className={`size-10 rounded-full bg-muted flex items-center justify-center ${k.tone}`}>
              <k.icon className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">{k.label}</div>
              <div className="mt-0.5 text-xl font-bold truncate">{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <HistoryFilters
          professionals={professionals}
          selectedProfessionalId={professionalFilter}
          statuses={statuses}
          fromIso={fromStr}
          toIso={toStr}
        />
      </div>

      <div className="mt-6">
        {bookings.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
            Nenhum agendamento encontrado com esses filtros.
          </div>
        ) : (
          <>
            {/* Tabela (desktop) */}
            <div className="hidden md:block rounded-xl border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quando</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Profissional</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="font-medium">
                          {formatLocal(new Date(b.startsAtIso), tz, "dd/MM/yyyy")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatLocal(new Date(b.startsAtIso), tz, "HH:mm")} —{" "}
                          {formatLocal(new Date(b.endsAtIso), tz, "HH:mm")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{b.clientName}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          {formatNationalBR(b.clientPhone)}
                          <a
                            href={`https://wa.me/${b.clientPhone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Abrir WhatsApp"
                            className="text-primary hover:opacity-80"
                          >
                            <MessageCircle className="size-3.5" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>{b.serviceName}</TableCell>
                      <TableCell>{b.professionalName}</TableCell>
                      <TableCell className="text-right whitespace-nowrap font-medium">
                        {formatBRL(b.servicePriceCents)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            b.status === "COMPLETED" ? "default" : "secondary"
                          }
                        >
                          {STATUS_LABEL[b.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Lista (mobile) */}
            <div className="md:hidden space-y-2">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="rounded-lg border bg-card p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{b.clientName}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {b.serviceName} · {b.professionalName}
                      </div>
                    </div>
                    <Badge
                      variant={b.status === "COMPLETED" ? "default" : "secondary"}
                      className="shrink-0"
                    >
                      {STATUS_LABEL[b.status]}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {formatLocal(new Date(b.startsAtIso), tz, "dd/MM 'às' HH:mm")}
                    </span>
                    <span className="font-medium">
                      {formatBRL(b.servicePriceCents)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
