import type { OrgPlan } from "@prisma/client"

import { db } from "@/lib/db"
import {
  createCustomer,
  createSubscription,
  cancelSubscription as asaasCancelSubscription,
  getFirstPaymentInvoiceUrl,
  AsaasError,
} from "@/lib/asaas"
import {
  getPlanPriceBRL,
  isBillingEnabled,
  isValidPlanForType,
} from "./plans"

export class BillingError extends Error {
  constructor(
    public code:
      | "ALREADY_SUBSCRIBED"
      | "INVALID_PLAN"
      | "ASAAS_ERROR"
      | "ORG_NOT_FOUND"
      | "MISSING_TAX_ID"
      | "PENDING_IN_FLIGHT",
    message: string,
  ) {
    super(message)
  }
}

const PENDING_LOCK_SECONDS = 30

export async function subscribeToPlan(
  organizationId: string,
  targetPlan: Exclude<OrgPlan, "FREE">,
  ownerEmail: string,
): Promise<{ paymentLink: string; subscriptionId: string }> {
  if (!isBillingEnabled()) {
    throw new BillingError("ASAAS_ERROR", "Planos pagos ainda não estão disponíveis")
  }

  const org = await db.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      type: true,
      taxId: true,
      plan: true,
      asaasCustomerId: true,
      asaasSubscriptionId: true,
      asaasPendingPlan: true,
      updatedAt: true,
    },
  })
  if (!org) throw new BillingError("ORG_NOT_FOUND", "Empresa não encontrada")

  if (!org.taxId) {
    throw new BillingError("MISSING_TAX_ID", "Cadastre CPF/CNPJ antes de assinar um plano")
  }

  if (!isValidPlanForType(targetPlan, org.type)) {
    throw new BillingError("INVALID_PLAN", "Plano incompatível com o tipo de conta")
  }

  if (org.asaasSubscriptionId && org.plan === targetPlan && !org.asaasPendingPlan) {
    throw new BillingError("ALREADY_SUBSCRIBED", "Você já está nesse plano")
  }

  const lockAge = (Date.now() - org.updatedAt.getTime()) / 1000
  if (org.asaasPendingPlan && lockAge < PENDING_LOCK_SECONDS) {
    throw new BillingError(
      "PENDING_IN_FLIGHT",
      "Aguarde alguns instantes — outra assinatura está sendo processada.",
    )
  }

  let asaasCustomerId = org.asaasCustomerId
  let newSubscriptionId: string | null = null

  try {
    if (org.asaasSubscriptionId) {
      try {
        await asaasCancelSubscription(org.asaasSubscriptionId)
      } catch (err) {
        console.error(
          "[billing] Falha ao cancelar subscription antiga (best-effort)",
          org.asaasSubscriptionId,
          err,
        )
      }
    }

    if (!asaasCustomerId) {
      const customer = await createCustomer({
        name: org.name,
        email: ownerEmail,
        cpfCnpj: org.taxId,
        externalReference: org.id,
      })
      asaasCustomerId = customer.id
      await db.organization.update({
        where: { id: org.id },
        data: { asaasCustomerId },
      })
    }

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextDueDate = tomorrow.toISOString().slice(0, 10)

    const priceBRL = getPlanPriceBRL(targetPlan, org.type)

    const subscription = await createSubscription({
      customer: asaasCustomerId,
      billingType: "UNDEFINED",
      value: priceBRL,
      nextDueDate,
      cycle: "MONTHLY",
      description: `Reserve Já — Plano ${targetPlan}`,
      externalReference: org.id,
    })
    newSubscriptionId = subscription.id

    const invoiceUrl = await getFirstPaymentInvoiceUrl(subscription.id)
    if (!invoiceUrl) {
      throw new BillingError(
        "ASAAS_ERROR",
        "Não foi possível obter o link de pagamento. Tente novamente.",
      )
    }

    await db.organization.update({
      where: { id: org.id },
      data: {
        asaasSubscriptionId: subscription.id,
        asaasPendingPlan: targetPlan,
      },
    })

    return { paymentLink: invoiceUrl, subscriptionId: subscription.id }
  } catch (err) {
    if (newSubscriptionId) {
      try {
        await asaasCancelSubscription(newSubscriptionId)
      } catch (cancelErr) {
        console.error(
          "[billing] Falha ao reverter subscription após erro",
          newSubscriptionId,
          cancelErr,
        )
      }
    }
    if (err instanceof BillingError) throw err
    if (err instanceof AsaasError) {
      console.error("[billing] Asaas API error", err.status, err.body)
      throw new BillingError("ASAAS_ERROR", "Erro ao processar pagamento. Tente novamente.")
    }
    throw err
  }
}
