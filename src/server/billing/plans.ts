import type { OrgPlan, OrgType } from "@prisma/client"

export type PlanConfig = {
  id: OrgPlan
  namePT: string
  priceCents: number
  limitUnits: number
  limitUsers: number
  limitBookingsPerMonth: number
}

const PLANS: Record<`${OrgPlan}_${OrgType}`, PlanConfig> = {
  FREE_AUTONOMO: {
    id: "FREE",
    namePT: "Grátis",
    priceCents: 0,
    limitUnits: 1,
    limitUsers: 1,
    limitBookingsPerMonth: 30,
  },
  PRO_AUTONOMO: {
    id: "PRO",
    namePT: "Pro",
    priceCents: 2990,
    limitUnits: 1,
    limitUsers: 1,
    limitBookingsPerMonth: 500,
  },
  FREE_EMPRESA: {
    id: "FREE",
    namePT: "Grátis",
    priceCents: 0,
    limitUnits: 1,
    limitUsers: 2,
    limitBookingsPerMonth: 50,
  },
  PROFISSIONAL_EMPRESA: {
    id: "PROFISSIONAL",
    namePT: "Profissional",
    priceCents: 5990,
    limitUnits: 3,
    limitUsers: 10,
    limitBookingsPerMonth: 2000,
  },
  EMPRESARIAL_EMPRESA: {
    id: "EMPRESARIAL",
    namePT: "Empresarial",
    priceCents: 14990,
    limitUnits: 10,
    limitUsers: 30,
    limitBookingsPerMonth: 6000,
  },
  // Combinações inválidas — fallback pro FREE do tipo
  PRO_EMPRESA: {
    id: "FREE",
    namePT: "Grátis",
    priceCents: 0,
    limitUnits: 1,
    limitUsers: 2,
    limitBookingsPerMonth: 50,
  },
  PROFISSIONAL_AUTONOMO: {
    id: "FREE",
    namePT: "Grátis",
    priceCents: 0,
    limitUnits: 1,
    limitUsers: 1,
    limitBookingsPerMonth: 30,
  },
  EMPRESARIAL_AUTONOMO: {
    id: "FREE",
    namePT: "Grátis",
    priceCents: 0,
    limitUnits: 1,
    limitUsers: 1,
    limitBookingsPerMonth: 30,
  },
}

export function getPlanConfig(plan: OrgPlan, orgType: OrgType): PlanConfig {
  return PLANS[`${plan}_${orgType}`]
}

export function getLimitsForPlan(plan: OrgPlan, orgType: OrgType) {
  const cfg = getPlanConfig(plan, orgType)
  return {
    planLimitUnits: cfg.limitUnits,
    planLimitUsers: cfg.limitUsers,
    planLimitBookingsPerMonth: cfg.limitBookingsPerMonth,
  }
}

export function isValidPlanForType(plan: OrgPlan, orgType: OrgType): boolean {
  if (plan === "FREE") return true
  if (plan === "PRO") return orgType === "AUTONOMO"
  return orgType === "EMPRESA"
}

export function getPlanPriceBRL(plan: OrgPlan, orgType: OrgType): number {
  return getPlanConfig(plan, orgType).priceCents / 100
}

export function isBillingEnabled(): boolean {
  return !!process.env.ASAAS_API_KEY
}
