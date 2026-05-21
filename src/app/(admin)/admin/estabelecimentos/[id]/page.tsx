import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, ExternalLink } from "lucide-react"
import type { BookingStatus } from "@prisma/client"

import { requireRole } from "@/server/auth/guards"
import { db } from "@/lib/db"
import { BUSINESS_CATEGORY_LABEL } from "@/lib/business-categories"
import { maskTaxId } from "@/lib/tax"
import { formatLocal } from "@/lib/time"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { OrgStatusActions } from "@/components/admin/org-status-actions"

const MEMBERSHIP_ROLE_LABEL = { OWNER: "Dono", STAFF: "Equipe" } as const

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  NO_SHOW: "Não compareceu",
}

export default async function AdminOrgDetailPage(
  props: { params: Promise<{ id: string }> },
) {
  await requireRole("ADMIN")
  const { id } = await props.params

  const org = await db.organization.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      category: true,
      taxId: true,
      status: true,
      planLimitUnits: true,
      planLimitUsers: true,
      createdAt: true,
      establishments: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          timezone: true,
          city: true,
          state: true,
          createdAt: true,
          _count: {
            select: { services: true, professionals: true, bookings: true },
          },
        },
      },
      memberships: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  })
  if (!org) notFound()

  const establishmentIds = org.establishments.map((e) => e.id)
  const latestBookings =
    establishmentIds.length > 0
      ? await db.booking.findMany({
          where: { establishmentId: { in: establishmentIds } },
          orderBy: { startsAt: "desc" },
          take: 20,
          select: {
            id: true,
            startsAt: true,
            status: true,
            clientName: true,
            service: { select: { name: true } },
            professional: { select: { name: true } },
            establishment: { select: { name: true, slug: true, timezone: true } },
          },
        })
      : []

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 space-y-8">
      <div>
        <Link
          href="/admin/estabelecimentos"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          Voltar
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{org.name}</h1>
          <Badge variant={org.status === "ACTIVE" ? "default" : "secondary"}>
            {org.status}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {BUSINESS_CATEGORY_LABEL[org.category] ?? org.category}
          {org.taxId ? <> · {maskTaxId(org.taxId)}</> : null}
          {" · "}
          Criada em {org.createdAt.toLocaleDateString("pt-BR")}
        </p>
      </div>

      <section className="rounded-xl border bg-card p-4 md:p-5">
        <h2 className="text-sm font-semibold mb-3">Ações</h2>
        <OrgStatusActions organizationId={org.id} status={org.status} />
      </section>

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">
            Unidades ({org.establishments.length}/{org.planLimitUnits})
          </h2>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {org.establishments.map((e) => (
            <div key={e.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium truncate">{e.name}</div>
                  <Link
                    href={`/${e.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-mono mt-0.5"
                  >
                    /{e.slug}
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-md bg-muted px-2 py-2">
                  <div className="font-bold text-foreground">
                    {e._count.services}
                  </div>
                  <div className="text-muted-foreground">Serviços</div>
                </div>
                <div className="rounded-md bg-muted px-2 py-2">
                  <div className="font-bold text-foreground">
                    {e._count.professionals}
                  </div>
                  <div className="text-muted-foreground">Profissionais</div>
                </div>
                <div className="rounded-md bg-muted px-2 py-2">
                  <div className="font-bold text-foreground">
                    {e._count.bookings}
                  </div>
                  <div className="text-muted-foreground">Bookings</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {[e.city, e.state].filter(Boolean).join(" / ") || "—"} ·{" "}
                {e.timezone}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">
          Equipe ({org.memberships.length}/{org.planLimitUsers})
        </h2>
        <div className="mt-3 rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Desde</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {org.memberships.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{m.user.email}</TableCell>
                  <TableCell>
                    <Badge variant={m.role === "OWNER" ? "default" : "secondary"}>
                      {MEMBERSHIP_ROLE_LABEL[m.role]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {m.createdAt.toLocaleDateString("pt-BR")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Últimos agendamentos</h2>
        {latestBookings.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Sem agendamentos ainda.
          </p>
        ) : (
          <div className="mt-3 rounded-xl border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestBookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatLocal(b.startsAt, b.establishment.timezone, "dd/MM HH:mm")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {b.establishment.name}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {b.clientName}
                    </TableCell>
                    <TableCell className="text-sm">{b.service.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {b.professional.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={b.status === "COMPLETED" ? "default" : "secondary"}
                      >
                        {STATUS_LABEL[b.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  )
}
