import { requireOwnerMembership } from "@/server/auth/guards"
import { db } from "@/lib/db"
import { ServicesList } from "@/components/panel/services-list"

export default async function PanelServicesPage() {
  const { establishment } = await requireOwnerMembership()
  const services = await db.service.findMany({
    where: { establishmentId: establishment.id },
    select: {
      id: true,
      name: true,
      description: true,
      durationMin: true,
      priceCents: true,
      active: true,
    },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  })

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <ServicesList services={services} />
    </div>
  )
}
