import { db } from "@/lib/db"
import { cancelSubscription as asaasCancelSubscription } from "@/lib/asaas"
import { getLimitsForPlan } from "./plans"

export type AsaasWebhookPayload = {
  event: string
  payment: {
    id: string
    subscription?: string
    customer: string
    status: string
    value: number
  }
}

const GRACE_DAYS = 7

export async function processWebhookEvent(
  payload: AsaasWebhookPayload,
): Promise<void> {
  const { event, payment } = payload

  if (!payment.subscription) return

  const org = await db.organization.findFirst({
    where: { asaasSubscriptionId: payment.subscription },
    select: {
      id: true,
      type: true,
      plan: true,
      asaasPendingPlan: true,
      asaasSubscriptionId: true,
    },
  })
  if (!org) {
    console.warn("[billing:webhook] Org não encontrada para subscription", payment.subscription)
    return
  }

  switch (event) {
    case "PAYMENT_CONFIRMED":
    case "PAYMENT_RECEIVED":
    case "PAYMENT_RESTORED": {
      // CONFIRMED/RECEIVED = pagamento do ciclo confirmado.
      // RESTORED = cobrança que havia sido removida foi restaurada → reativa o plano
      // em vez de rebaixar (não agrupar com REFUNDED/DELETED).
      const activePlan = org.asaasPendingPlan ?? org.plan
      const limits = getLimitsForPlan(activePlan, org.type)
      await db.organization.update({
        where: { id: org.id },
        data: {
          plan: activePlan,
          status: "ACTIVE",
          planExpiresAt: null,
          asaasPendingPlan: null,
          ...limits,
        },
      })
      break
    }

    case "PAYMENT_OVERDUE": {
      const grace = new Date()
      grace.setDate(grace.getDate() + GRACE_DAYS)
      await db.organization.update({
        where: { id: org.id },
        data: { planExpiresAt: grace },
      })
      break
    }

    case "PAYMENT_REFUNDED":
    case "PAYMENT_DELETED": {
      // Estorno/remoção da cobrança → cancela a assinatura no Asaas (best-effort)
      // antes de zerar o vínculo. Sem isso, a assinatura continuaria viva no Asaas
      // gerando cobranças futuras de uma org que o app já trata como FREE — e o
      // próximo PAYMENT_CONFIRMED não acharia a org (asaasSubscriptionId zerado).
      if (org.asaasSubscriptionId) {
        try {
          await asaasCancelSubscription(org.asaasSubscriptionId)
        } catch (err) {
          console.error(
            "[billing:webhook] Falha ao cancelar subscription no Asaas (best-effort)",
            org.asaasSubscriptionId,
            err,
          )
        }
      }
      const freeLimits = getLimitsForPlan("FREE", org.type)
      await db.organization.update({
        where: { id: org.id },
        data: {
          plan: "FREE",
          asaasSubscriptionId: null,
          asaasPendingPlan: null,
          planExpiresAt: null,
          status: "ACTIVE",
          ...freeLimits,
        },
      })
      break
    }

    default:
      break
  }
}
