import { requireOwnerRole } from "@/server/auth/guards"
import { db } from "@/lib/db"
import { TeamPanel, type MemberRow } from "@/components/panel/team-panel"

export default async function PanelEquipePage() {
  const { session, organization } = await requireOwnerRole()

  const memberships = await db.membership.findMany({
    where: { organizationId: organization.id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      units: { select: { establishmentId: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  const allUnits = await db.establishment.findMany({
    where: { organizationId: organization.id },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  })

  const members: MemberRow[] = memberships.map((m) => ({
    membershipId: m.id,
    userId: m.user.id,
    name: m.user.name,
    email: m.user.email,
    role: m.role,
    unitIds: m.units.map((u) => u.establishmentId),
    isSelf: m.user.id === session.user.id,
  }))

  return (
    <div className="px-8 py-8 max-w-2xl">
      <TeamPanel
        members={members}
        units={allUnits}
        planLimitUsers={organization.planLimitUsers}
      />
    </div>
  )
}
