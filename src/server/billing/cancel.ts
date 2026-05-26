import { db } from "@/lib/db"
import { cancelSubscription as asaasCancelSubscription } from "@/lib/asaas"
import { getLimitsForPlan } from "./plans"

export async function cancelSubscription(organizationId: string): Promise<void> {
  const org = await db.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, type: true, asaasSubscriptionId: true },
  })
  if (!org || !org.asaasSubscriptionId) return

  try {
    await asaasCancelSubscription(org.asaasSubscriptionId)
  } catch (err) {
    console.error("[billing] Falha ao cancelar no Asaas (best-effort)", err)
  }

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
}
