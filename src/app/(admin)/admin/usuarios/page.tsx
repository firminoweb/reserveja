import { requireRole } from "@/server/auth/guards"
import { db } from "@/lib/db"
import { UsersPanel } from "@/components/admin/users-panel"

export default async function AdminUsersPage() {
  const session = await requireRole("ADMIN")
  // Quando admin já está impersonando, não deveria ver botões "Entrar como"
  // (precisaria parar primeiro). Mas como /admin exige ADMIN efetivo, se ele
  // chegou aqui é porque NÃO está impersonando — sempre false. Mantemos a
  // prop pro caso de mudarmos esse comportamento.
  const isImpersonating = false

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      memberships: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: {
          organization: { select: { name: true } },
        },
      },
      _count: { select: { memberships: true } },
    },
  })

  const flat = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    membershipCount: u._count.memberships,
    createdAtIso: u.createdAt.toISOString(),
    organizationName: u.memberships[0]?.organization.name ?? null,
  }))

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">Usuários</h1>
        <span className="text-sm text-muted-foreground">
          {flat.length} {flat.length === 1 ? "usuário" : "usuários"}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Gerencia todos os usuários da plataforma — promover/rebaixar e resetar
        senhas.
      </p>

      <div className="mt-6">
        <UsersPanel
          users={flat}
          currentUserId={session.user.id}
          isImpersonating={isImpersonating}
        />
      </div>
    </div>
  )
}
