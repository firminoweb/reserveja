"use client"

import { useState } from "react"
import { Check, Sparkles } from "lucide-react"
import { toast } from "sonner"
import type { OrgPlan } from "@prisma/client"

import { Button } from "@/components/ui/button"
import { subscribePlanAction } from "@/app/(panel)/painel/plano/actions"

type Props = {
  planId: Exclude<OrgPlan, "FREE">
  namePT: string
  priceCents: number
  features: string[]
  currentPlan: OrgPlan
  recommended?: boolean
}

export function BillingPlanCard({
  planId,
  namePT,
  priceCents,
  features,
  currentPlan,
  recommended,
}: Props) {
  const [loading, setLoading] = useState(false)
  const isCurrent = currentPlan === planId
  const isDowngrade = currentPlan !== "FREE" && priceCents === 0

  async function handleUpgrade() {
    setLoading(true)
    const res = await subscribePlanAction({ plan: planId })
    setLoading(false)

    if (!res.ok) {
      toast.error(res.message)
      return
    }
    window.open(res.paymentLink, "_blank")
    toast.success("Link de pagamento aberto em nova aba")
  }

  return (
    <div
      className={`rounded-2xl border bg-card p-6 shadow-sm flex flex-col relative ${
        recommended ? "border-2 border-primary shadow-lg" : ""
      }`}
    >
      {recommended && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
          <Sparkles className="size-3" aria-hidden />
          Recomendado
        </span>
      )}

      <h3 className="text-lg font-semibold">{namePT}</h3>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-bold">
          R$ {(priceCents / 100).toFixed(2).replace(".", ",")}
        </span>
        <span className="text-sm text-muted-foreground">/mês</span>
      </div>

      {isCurrent ? (
        <Button size="lg" className="mt-5 w-full" disabled>
          Plano atual
        </Button>
      ) : isDowngrade ? null : (
        <Button
          size="lg"
          className="mt-5 w-full"
          onClick={handleUpgrade}
          disabled={loading}
        >
          {loading ? "Processando..." : "Fazer upgrade"}
        </Button>
      )}

      <ul className="mt-5 space-y-2 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check className="size-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
