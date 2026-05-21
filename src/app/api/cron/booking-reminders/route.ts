import { timingSafeEqual } from "node:crypto"

import { NextResponse, type NextRequest } from "next/server"

import { dispatchDueReminders } from "@/server/booking/reminders"

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

/**
 * Endpoint para scheduler externo (Vercel Cron, Railway Cron, etc.).
 * Roda a cada 5 min e dispara lembretes pra bookings que começam em ~1h.
 *
 * Auth: header `Authorization: Bearer <CRON_SECRET>` ou query `?key=<secret>`
 * (vercel/railway usam header).
 */
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
    const summary = await dispatchDueReminders()
    return NextResponse.json({ ok: true, ...summary })
  } catch (err) {
    console.error("[cron/booking-reminders] erro", err)
    return NextResponse.json({ error: "internal" }, { status: 500 })
  }
}
