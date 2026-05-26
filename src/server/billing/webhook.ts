import { db } from "@/lib/db"
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
    select: { id: true, type: true, plan: true },
  })
  if (!org) {
    console.warn("[billing:webhook] Org não encontrada para subscription", payment.subscription)
    return
  }

  switch (event) {
    case "PAYMENT_CONFIRMED":
    case "PAYMENT_RECEIVED": {
      await db.organization.update({
        where: { id: org.id },
        data: { status: "ACTIVE", planExpiresAt: null },
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
    case "PAYMENT_DELETED":
    case "PAYMENT_RESTORED": {
      // Restaura pro plano FREE
      const freeLimits = getLimitsForPlan("FREE", org.type)
      await db.organization.update({
        where: { id: org.id },
        data: {
          plan: "FREE",
          asaasSubscriptionId: null,
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
