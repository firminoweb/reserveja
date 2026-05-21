import Link from "next/link"
import {
  ArrowDown,
  ArrowUp,
  Building2,
  CalendarCheck,
  Minus,
  TrendingUp,
  Users,
} from "lucide-react"

import { getAdminDashboard } from "@/server/admin/dashboard"
import { BarChart } from "@/components/admin/bar-chart"

function formatPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`
}

function trendArrow(curr: number, prev: number) {
  if (prev === 0 && curr === 0) return { icon: Minus, tone: "text-muted-foreground", label: "—" }
  if (prev === 0) return { icon: ArrowUp, tone: "text-emerald-600", label: "novo" }
  const diff = ((curr - prev) / prev) * 100
  if (Math.abs(diff) < 0.5)
    return { icon: Minus, tone: "text-muted-foreground", label: "estável" }
  if (diff > 0)
    return { icon: ArrowUp, tone: "text-emerald-600", label: `+${diff.toFixed(0)}%` }
  return { icon: ArrowDown, tone: "text-rose-600", label: `${diff.toFixed(0)}%` }
}

function dayLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00Z")
  return String(d.getUTCDate()).padStart(2, "0")
}

export default async function AdminHomePage() {
  const data = await getAdminDashboard()

  const trend = trendArrow(
    data.trends.bookingsLast7Days,
    data.trends.bookingsPrev7Days,
  )
  const TrendIcon = trend.icon

  const kpis = [
    {
      label: "Empresas",
      value: data.totals.organizations,
      sub: `${data.totals.activeOrganizations} ativas · ${data.totals.suspendedOrganizations} suspensas`,
      icon: Building2,
    },
    {
      label: "Unidades",
      value: data.totals.establishments,
      sub: "Estabelecimentos no total",
      icon: Building2,
    },
    {
      label: "Usuários",
      value: data.totals.users,
      sub: "Cadastrados",
      icon: Users,
    },
    {
      label: "Agendamentos",
      value: data.totals.bookings,
      sub: "Desde o início",
      icon: CalendarCheck,
    },
  ]

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Visão geral</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pulso da plataforma — números totais, tendências e atividade recente.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                {k.label}
              </span>
              <k.icon className="size-4 text-muted-foreground" aria-hidden />
            </div>
            <div className="mt-2 text-3xl font-bold tabular-nums">{k.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              Bookings 7 dias
            </span>
            <TrendIcon className={`size-4 ${trend.tone}`} aria-hidden />
          </div>
          <div className="mt-2 text-3xl font-bold tabular-nums">
            {data.trends.bookingsLast7Days}
          </div>
          <div className={`mt-1 text-xs ${trend.tone}`}>
            {trend.label} vs 7 dias anteriores ({data.trends.bookingsPrev7Days})
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              Novas empresas (30d)
            </span>
            <TrendingUp className="size-4 text-emerald-600" aria-hidden />
          </div>
          <div className="mt-2 text-3xl font-bold tabular-nums">
            {data.trends.newOrgsLast30Days}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Cadastradas nos últimos 30 dias
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              Taxa de cancelamento (30d)
            </span>
          </div>
          <div className="mt-2 text-3xl font-bold tabular-nums">
            {formatPct(data.trends.cancelRateLast30Days)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Bookings cancelados / total
          </div>
        </div>
      </div>

      <section className="rounded-xl border bg-card p-4 md:p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Agendamentos por dia</h2>
          <span className="text-xs text-muted-foreground">Últimos 14 dias</span>
        </div>
        <div className="mt-4">
          <BarChart
            data={data.bookingsByDay.map((d) => ({
              label: d.date,
              axis: dayLabel(d.date),
              value: d.count,
            }))}
          />
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4 md:p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Novas empresas por semana</h2>
          <span className="text-xs text-muted-foreground">Últimas 8 semanas</span>
        </div>
        <div className="mt-4">
          <BarChart
            data={data.newOrgsByWeek.map((w) => ({
              label: w.weekStartIso,
              axis: w.label,
              value: w.count,
            }))}
            className="fill-emerald-500"
          />
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4 md:p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Top estabelecimentos</h2>
          <span className="text-xs text-muted-foreground">
            Por nº de agendamentos · 30 dias
          </span>
        </div>
        {data.topEstablishments.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Sem atividade nos últimos 30 dias.
          </p>
        ) : (
          <ol className="mt-4 space-y-2">
            {data.topEstablishments.map((e, i) => {
              const max = Math.max(
                1,
                ...data.topEstablishments.map((x) => x.bookingCount),
              )
              const pct = (e.bookingCount / max) * 100
              return (
                <li key={e.id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <Link
                      href="/admin/estabelecimentos"
                      className="text-sm font-medium hover:underline underline-offset-4 truncate"
                    >
                      <span className="text-muted-foreground tabular-nums mr-2">
                        {i + 1}.
                      </span>
                      {e.name}
                      <span className="text-muted-foreground font-normal ml-1.5">
                        · {e.organizationName}
                      </span>
                    </Link>
                    <span className="text-sm tabular-nums shrink-0">
                      {e.bookingCount}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </section>
    </div>
  )
}
