import { requireOwnerMembership } from "@/server/auth/guards"
import { db } from "@/lib/db"
import { formatLocal } from "@/lib/time"
import { TimeBlocksPanel } from "@/components/panel/time-blocks-panel"

export default async function PanelBloqueiosPage() {
  const { establishment } = await requireOwnerMembership()

  const [blocks, professionals] = await Promise.all([
    db.timeBlock.findMany({
      where: {
        establishmentId: establishment.id,
        endsAt: { gte: new Date() },
      },
      include: { professional: { select: { id: true, name: true } } },
      orderBy: { startsAt: "asc" },
    }),
    db.professional.findMany({
      where: { establishmentId: establishment.id, active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  const items = blocks.map((b) => ({
    id: b.id,
    startsAt: formatLocal(b.startsAt, establishment.timezone, "dd/MM HH:mm"),
    endsAt: formatLocal(b.endsAt, establishment.timezone, "dd/MM HH:mm"),
    reason: b.reason,
    professional: b.professional,
  }))

  return (
    <div className="px-8 py-8">
      <TimeBlocksPanel blocks={items} professionals={professionals} />
    </div>
  )
}
