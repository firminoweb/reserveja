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

export type AsaasPayment = {
  id: string
  status: string
  invoiceUrl: string
  value: number
  dueDate: string
}

type AsaasPaymentList = {
  data: AsaasPayment[]
  totalCount: number
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

export async function getSubscriptionPayments(
  subscriptionId: string,
): Promise<AsaasPayment[]> {
  const result = await request<AsaasPaymentList>(
    `/subscriptions/${subscriptionId}/payments`,
  )
  return result.data
}

export async function getFirstPaymentInvoiceUrl(
  subscriptionId: string,
  maxRetries = 5,
): Promise<string | null> {
  for (let i = 0; i < maxRetries; i++) {
    const payments = await getSubscriptionPayments(subscriptionId)
    if (payments.length > 0 && payments[0].invoiceUrl) {
      return payments[0].invoiceUrl
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
  return null
}

export { AsaasError }
