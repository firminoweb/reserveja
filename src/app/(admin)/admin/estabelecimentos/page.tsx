import Link from "next/link"

import { db } from "@/lib/db"
import { BUSINESS_CATEGORY_LABEL } from "@/lib/business-categories"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function AdminEstabelecimentosPage() {
  const organizations = await db.organization.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      category: true,
      status: true,
      createdAt: true,
      _count: { select: { establishments: true } },
      establishments: { select: { slug: true }, orderBy: { createdAt: "asc" }, take: 1 },
    },
  })

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">Empresas</h1>
        <span className="text-sm text-muted-foreground">
          {organizations.length}{" "}
          {organizations.length === 1 ? "empresa" : "empresas"}
        </span>
      </div>

      <div className="mt-6 hidden md:block rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Unidades</TableHead>
              <TableHead>Slug principal</TableHead>
              <TableHead>Criada em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.map((o) => (
              <TableRow key={o.id}>
                <TableCell>
                  <Link
                    href={`/admin/estabelecimentos/${o.id}`}
                    className="font-medium hover:underline underline-offset-4"
                  >
                    {o.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {BUSINESS_CATEGORY_LABEL[o.category] ?? o.category}
                </TableCell>
                <TableCell>
                  <Badge variant={o.status === "ACTIVE" ? "default" : "secondary"}>
                    {o.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {o._count.establishments}
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-xs">
                  {o.establishments[0]?.slug ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {o.createdAt.toLocaleDateString("pt-BR")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden mt-6 space-y-2">
        {organizations.map((o) => (
          <Link
            key={o.id}
            href={`/admin/estabelecimentos/${o.id}`}
            className="block rounded-lg border bg-card p-3 hover:border-primary/40 hover:bg-primary/5 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{o.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {BUSINESS_CATEGORY_LABEL[o.category] ?? o.category}
                  {" · "}
                  {o._count.establishments}{" "}
                  {o._count.establishments === 1 ? "unidade" : "unidades"}
                </div>
              </div>
              <Badge
                variant={o.status === "ACTIVE" ? "default" : "secondary"}
                className="shrink-0"
              >
                {o.status}
              </Badge>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
