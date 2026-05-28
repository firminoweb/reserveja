import { db } from "@/lib/db"
import { cancelSubscription as asaasCancelSubscription } from "@/lib/asaas"

const PENDING_EXPIRE_DAYS = 7

export async function expirePendingSubscriptions(): Promise<{
  checked: number
  cancelled: number
}> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - PENDING_EXPIRE_DAYS)

  const candidates = await db.organization.findMany({
    where: {
      asaasPendingPlan: { not: null },
      asaasSubscriptionId: { not: null },
      updatedAt: { lt: cutoff },
    },
    select: { id: true, asaasSubscriptionId: true },
  })

  let cancelled = 0
  for (const org of candidates) {
    if (!org.asaasSubscriptionId) continue
    try {
      await asaasCancelSubscription(org.asaasSubscriptionId)
    } catch (err) {
      console.error(
        "[billing:expire-pending] Falha ao cancelar no Asaas",
        org.id,
        err,
      )
    }
    await db.organization.update({
      where: { id: org.id },
      data: {
        asaasSubscriptionId: null,
        asaasPendingPlan: null,
      },
    })
    cancelled++
  }

  return { checked: candidates.length, cancelled }
}
