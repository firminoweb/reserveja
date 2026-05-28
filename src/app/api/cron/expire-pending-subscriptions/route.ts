import { timingSafeEqual } from "node:crypto"

import { NextResponse, type NextRequest } from "next/server"

import { expirePendingSubscriptions } from "@/server/billing/expire-pending"

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: "cron_not_configured" }, { status: 503 })
  }

  const header = req.headers.get("authorization")
  const queryKey = req.nextUrl.searchParams.get("key")
  const provided =
    header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : queryKey

  if (!provided || !safeEqual(provided, secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  try {
    const summary = await expirePendingSubscriptions()
    return NextResponse.json({ ok: true, ...summary })
  } catch (err) {
    console.error("[cron/expire-pending-subscriptions] erro", err)
    return NextResponse.json({ error: "internal" }, { status: 500 })
  }
}
