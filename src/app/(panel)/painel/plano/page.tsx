import { requireOwnerRole } from "@/server/auth/guards"
import { getPlanConfig, isBillingEnabled } from "@/server/billing/plans"
import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { BillingPlanCard } from "@/components/panel/billing-plan-card"
import { CancelPlanButton } from "@/components/panel/cancel-plan-button"

function UsageBar({
  label,
  used,
  limit,
}: {
  label: string
  used: number
  limit: number
}) {
  const unlimited = limit === -1
  const pct = unlimited ? 0 : Math.min((used / limit) * 100, 100)
  const warn = !unlimited && pct >= 80

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium">{label}</span>
        <span className={warn ? "text-destructive font-semibold" : "text-muted-foreground"}>
          {used}/{unlimited ? "Ilimitado" : limit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${warn ? "bg-destructive" : "bg-primary"}`}
          style={{ width: unlimited ? "0%" : `${pct}%` }}
        />
      </div>
    </div>
  )
}

const AUTONOMO_PRO_FEATURES = [
  "Agendamentos ilimitados",
  "Lembretes por WhatsApp",
  "Imagens nos serviços",
  "Capa personalizada",
  "Relatórios e métricas",
]

const EMPRESA_PROF_FEATURES = [
  "Até 3 unidades",
  "Profissionais ilimitados",
  "Agendamentos ilimitados",
  "Lembretes por WhatsApp",
  "Gestão de equipe (staff)",
  "Relatórios e métricas",
]

const EMPRESA_EMPR_FEATURES = [
  "Unidades ilimitadas",
  "Tudo do Profissional",
  "Suporte prioritário",
  "API de integração",
]

export default async function PlanoPage() {
  const { organization } = await requireOwnerRole()

  const planConfig = getPlanConfig(organization.plan, organization.type)

  const startOfMonth = new Date()
  startOfMonth.setUTCDate(1)
  startOfMonth.setUTCHours(0, 0, 0, 0)

  const [unitCount, userCount, bookingCount] = await Promise.all([
    db.establishment.count({ where: { organizationId: organization.id } }),
    db.membership.count({ where: { organizationId: organization.id } }),
    db.booking.count({
      where: {
        establishment: { organizationId: organization.id },
        createdAt: { gte: startOfMonth },
        status: { not: "CANCELLED" },
      },
    }),
  ])

  const isPaid = organization.plan !== "FREE"
  const hasGrace = organization.planExpiresAt && organization.planExpiresAt > new Date()
  const billingActive = isBillingEnabled()

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-4xl">
      <h1 className="text-2xl font-bold">Plano</h1>

      {/* Status atual */}
      <div className="mt-6 rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{planConfig.namePT}</h2>
          {isPaid && <Badge variant="default">Ativo</Badge>}
          {!isPaid && organization.status === "TRIAL" && (
            <Badge variant="outline">Avaliação</Badge>
          )}
        </div>

        {hasGrace && (
          <p className="mt-2 text-sm text-destructive font-medium">
            Pagamento pendente — plano ativo até{" "}
            {organization.planExpiresAt!.toLocaleDateString("pt-BR")}
          </p>
        )}

        <div className="mt-5 space-y-3">
          <UsageBar
            label="Unidades"
            used={unitCount}
            limit={organization.planLimitUnits}
          />
          <UsageBar
            label="Membros da equipe"
            used={userCount}
            limit={organization.planLimitUsers}
          />
          <UsageBar
            label="Agendamentos este mês"
            used={bookingCount}
            limit={organization.planLimitBookingsPerMonth}
          />
        </div>

        {isPaid && (
          <div className="mt-5 pt-4 border-t">
            <CancelPlanButton />
          </div>
        )}
      </div>

      {/* Cards de upgrade */}
      {billingActive ? (
        <>
          <h2 className="mt-10 text-lg font-semibold">
            {isPaid ? "Trocar plano" : "Fazer upgrade"}
          </h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5">
            {organization.type === "AUTONOMO" && (
              <BillingPlanCard
                planId="PRO"
                namePT="Pro"
                priceCents={2990}
                features={AUTONOMO_PRO_FEATURES}
                currentPlan={organization.plan}
                recommended
              />
            )}

            {organization.type === "EMPRESA" && (
              <>
                <BillingPlanCard
                  planId="PROFISSIONAL"
                  namePT="Profissional"
                  priceCents={5990}
                  features={EMPRESA_PROF_FEATURES}
                  currentPlan={organization.plan}
                  recommended={organization.plan === "FREE"}
                />
                <BillingPlanCard
                  planId="EMPRESARIAL"
                  namePT="Empresarial"
                  priceCents={14990}
                  features={EMPRESA_EMPR_FEATURES}
                  currentPlan={organization.plan}
                  recommended={organization.plan === "PROFISSIONAL"}
                />
              </>
            )}
          </div>
        </>
      ) : (
        <div className="mt-10 rounded-xl border border-dashed bg-muted/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Planos pagos estarão disponíveis em breve.
          </p>
        </div>
      )}
    </div>
  )
}
