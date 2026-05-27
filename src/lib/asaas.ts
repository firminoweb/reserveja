const API_KEY = process.env.ASAAS_API_KEY ?? ""
const BASE_URL =
  process.env.ASAAS_API_URL ?? "https://sandbox.asaas.com/api/v3"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AsaasCustomer = {
  id: string
  name: string
  email: string
  cpfCnpj: string
}

export type AsaasSubscription = {
  id: string
  status: string
  value: number
  nextDueDate: string
  billingType: string
}

export type AsaasBillingType = "BOLETO" | "CREDIT_CARD" | "PIX" | "UNDEFINED"

type CreateCustomerData = {
  name: string
  email: string
  cpfCnpj: string
  mobilePhone?: string
  externalReference?: string
}

type CreateSubscriptionData = {
  customer: string
  billingType: AsaasBillingType
  value: number
  nextDueDate: string
  cycle: "MONTHLY"
  description: string
  externalReference?: string
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

class AsaasError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`Asaas API ${status}: ${JSON.stringify(body)}`)
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      access_token: API_KEY,
      ...options.headers,
    },
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new AsaasError(res.status, body)
  return body as T
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function createCustomer(
  data: CreateCustomerData,
): Promise<AsaasCustomer> {
  return request<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function createSubscription(
  data: CreateSubscriptionData,
): Promise<AsaasSubscription> {
  return request<AsaasSubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getSubscription(
  subscriptionId: string,
): Promise<AsaasSubscription> {
  return request<AsaasSubscription>(`/subscriptions/${subscriptionId}`)
}

export async function cancelSubscription(
  subscriptionId: string,
): Promise<void> {
  await request(`/subscriptions/${subscriptionId}`, { method: "DELETE" })
}

export function getPaymentLink(subscriptionId: string): string {
  const isSandbox = BASE_URL.includes("sandbox")
  const host = isSandbox ? "https://sandbox.asaas.com" : "https://www.asaas.com"
  return `${host}/c/${subscriptionId}`
}

export { AsaasError }
