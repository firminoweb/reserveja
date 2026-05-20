import { requireOwnerMembership } from "@/server/auth/guards"
import { db } from "@/lib/db"
import { ProfessionalsList } from "@/components/panel/professionals-list"

export default async function PanelProfessionalsPage() {
  const { establishment } = await requireOwnerMembership()

  const [professionals, services] = await Promise.all([
    db.professional.findMany({
      where: { establishmentId: establishment.id },
      include: {
        services: { select: { serviceId: true } },
        schedules: { select: { weekday: true, startMin: true, endMin: true } },
      },
      orderBy: [{ active: "desc" }, { name: "asc" }],
    }),
    db.service.findMany({
      where: { establishmentId: establishment.id },
      select: { id: true, name: true, active: true },
      orderBy: { name: "asc" },
    }),
  ])

  const items = professionals.map((p) => ({
    id: p.id,
    name: p.name,
    active: p.active,
    serviceIds: p.services.map((s) => s.serviceId),
    schedules: p.schedules,
  }))

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <ProfessionalsList professionals={items} serviceOptions={services} />
    </div>
  )
}
