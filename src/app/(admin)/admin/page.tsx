import { db } from "@/lib/db"

export default async function AdminHomePage() {
  const [totalOrgs, activeOrgs, totalUnits, totalUsers, totalBookings] =
    await Promise.all([
      db.organization.count(),
      db.organization.count({ where: { status: "ACTIVE" } }),
      db.establishment.count(),
      db.user.count(),
      db.booking.count(),
    ])

  return (
    <div className="px-8 py-8">
      <h1 className="text-2xl font-bold">Visão geral</h1>
      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Empresas", value: totalOrgs },
          { label: "Ativas", value: activeOrgs },
          { label: "Unidades", value: totalUnits },
          { label: "Usuários", value: totalUsers },
          { label: "Agendamentos (total)", value: totalBookings },
        ].map((m) => (
          <div key={m.label} className="rounded-lg border p-5">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{m.label}</div>
            <div className="mt-2 text-3xl font-bold">{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
