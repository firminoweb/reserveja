"use server"

import { revalidatePath } from "next/cache"

import { requireOwnerRole } from "@/server/auth/guards"
import { subscribeToPlan, BillingError } from "@/server/billing/subscribe"
import { cancelSubscription } from "@/server/billing/cancel"
import {
  subscribePlanSchema,
  type SubscribePlanInput,
} from "@/lib/validations/billing"

type SubscribeResult =
  | { ok: true; paymentLink: string }
  | { ok: false; message: string }

type CancelResult =
  | { ok: true; expiresAt: string }
  | { ok: false; message: string }

export async function subscribePlanAction(
  input: SubscribePlanInput,
): Promise<SubscribeResult> {
  const { session, organization } = await requireOwnerRole()

  const parsed = subscribePlanSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: "Plano inválido" }
  }

  try {
    const result = await subscribeToPlan(
      organization.id,
      parsed.data.plan,
      session.user.email ?? "",
    )
    revalidatePath("/painel/plano")
    return { ok: true, paymentLink: result.paymentLink }
  } catch (err) {
    if (err instanceof BillingError) {
      return { ok: false, message: err.message }
    }
    console.error("[plano] subscribeToPlan falhou", err)
    return { ok: false, message: "Erro ao processar. Tente novamente." }
  }
}

export async function cancelSubscriptionAction(): Promise<CancelResult> {
  const { organization } = await requireOwnerRole()

  try {
    const { expiresAt } = await cancelSubscription(organization.id)
    revalidatePath("/painel/plano")
    revalidatePath("/painel")
    return { ok: true, expiresAt: expiresAt.toISOString() }
  } catch (err) {
    console.error("[plano] cancelSubscription falhou", err)
    return { ok: false, message: "Erro ao cancelar. Tente novamente." }
  }
}
