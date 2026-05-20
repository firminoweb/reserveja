import { requireOwnerMembership } from "@/server/auth/guards"
import { UnitsPanel } from "@/components/panel/units-panel"

export default async function PanelUnidadesPage() {
  const { organization, establishment, establishments, role } =
    await requireOwnerMembership()

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-2xl">
      <UnitsPanel
        organizationName={organization.name}
        units={establishments.map((e) => ({
          id: e.id,
          name: e.name,
          slug: e.slug,
          description: e.description,
          whatsapp: e.whatsapp,
          timezone: e.timezone,
        }))}
        currentUnitId={establishment.id}
        planLimitUnits={organization.planLimitUnits}
        canManage={role === "OWNER"}
      />
    </div>
  )
}
