import { db } from "@/lib/db"
import {
  cancelSubscription as asaasCancelSubscription,
  getSubscription,
} from "@/lib/asaas"
import { getLimitsForPlan } from "./plans"

export async function cancelSubscription(
  organizationId: string,
): Promise<{ expiresAt: Date }> {
  const org = await db.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, type: true, plan: true, asaasSubscriptionId: true },
  })
  if (!org || !org.asaasSubscriptionId) {
    return { expiresAt: new Date() }
  }

  let expiresAt = new Date()

  try {
    const sub = await getSubscription(org.asaasSubscriptionId)
    if (sub.nextDueDate) {
      expiresAt = new Date(sub.nextDueDate)
    }
  } catch (err) {
    console.error("[billing] Falha ao buscar subscription no Asaas", err)
  }

  try {
    await asaasCancelSubscription(org.asaasSubscriptionId)
  } catch (err) {
    console.error("[billing] Falha ao cancelar no Asaas (best-effort)", err)
  }

  if (expiresAt <= new Date()) {
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
  } else {
    await db.organization.update({
      where: { id: org.id },
      data: {
        asaasSubscriptionId: null,
        asaasPendingPlan: null,
        planExpiresAt: expiresAt,
      },
    })
  }

  return { expiresAt }
}

export async function downgradeExpiredPlans(): Promise<number> {
  const expired = await db.organization.findMany({
    where: {
      plan: { not: "FREE" },
      planExpiresAt: { lte: new Date() },
      asaasSubscriptionId: null,
    },
    select: { id: true, type: true },
  })

  for (const org of expired) {
    const freeLimits = getLimitsForPlan("FREE", org.type)
    await db.organization.update({
      where: { id: org.id },
      data: {
        plan: "FREE",
        planExpiresAt: null,
        status: "ACTIVE",
        ...freeLimits,
      },
    })
  }

  return expired.length
}
