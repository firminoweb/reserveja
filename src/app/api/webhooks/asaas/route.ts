import { timingSafeEqual } from "node:crypto"

import { NextResponse, type NextRequest } from "next/server"

import { db } from "@/lib/db"
import {
  processWebhookEvent,
  type AsaasWebhookPayload,
} from "@/server/billing/webhook"

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export async function POST(req: NextRequest) {
  const expected = process.env.ASAAS_WEBHOOK_SECRET
  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "webhook_not_configured" }, { status: 503 })
    }
  } else {
    const headerToken = req.headers.get("asaas-access-token")
    const queryToken = req.nextUrl.searchParams.get("token")
    const provided = headerToken ?? queryToken
    if (!provided || !safeEqual(provided, expected)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
  }

  const body = (await req.json().catch(() => null)) as AsaasWebhookPayload | null
  if (!body?.event || !body?.payment?.id) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 })
  }

  const isProd = process.env.NODE_ENV === "production"
  const debug = (info: Record<string, unknown>) =>
    isProd ? { ok: true } : { ok: true, ...info }

  const existing = await db.billingEvent.findUnique({
    where: {
      asaasPaymentId_event: {
        asaasPaymentId: body.payment.id,
        event: body.event,
      },
    },
    select: { id: true },
  })
  if (existing) {
    return NextResponse.json(debug({ debug: "duplicate_event" }))
  }

  const org = body.payment.subscription
    ? await db.organization.findFirst({
        where: { asaasSubscriptionId: body.payment.subscription },
        select: { id: true },
      })
    : null

  if (!org) {
    console.warn(
      "[asaas-webhook] Org não encontrada para subscription",
      body.payment.subscription,
    )
    return NextResponse.json(
      debug({ debug: "org_not_found", subscription: body.payment.subscription }),
    )
  }

  await db.billingEvent.create({
    data: {
      organizationId: org.id,
      asaasPaymentId: body.payment.id,
      event: body.event,
    },
  })

  try {
    await processWebhookEvent(body)
  } catch (err) {
    console.error("[asaas-webhook] Erro ao processar evento", body.event, err)
    return NextResponse.json({ error: "processing_error" }, { status: 500 })
  }

  return NextResponse.json(debug({ debug: "processed", orgId: org.id }))
}
