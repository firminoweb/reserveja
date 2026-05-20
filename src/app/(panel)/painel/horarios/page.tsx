import { requireOwnerMembership } from "@/server/auth/guards"
import { db } from "@/lib/db"
import { WorkingHoursForm } from "@/components/panel/working-hours-form"

export default async function PanelHorariosPage() {
  const { establishment } = await requireOwnerMembership()
  const hours = await db.workingHour.findMany({
    where: { establishmentId: establishment.id },
    select: { weekday: true, startMin: true, endMin: true },
    orderBy: [{ weekday: "asc" }, { startMin: "asc" }],
  })

  return (
    <div className="px-8 py-8">
      <h1 className="text-2xl font-bold">Horário de funcionamento</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Define quando o salão atende. Bloqueios pontuais (almoço, folga) ficam em
        Bloqueios.
      </p>
      <WorkingHoursForm initial={hours} />
    </div>
  )
}
