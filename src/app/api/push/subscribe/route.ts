import { NextResponse, type NextRequest } from "next/server"

import { db } from "@/lib/db"
import { clientIp, rateLimit } from "@/lib/rate-limit"
import { z } from "@/lib/zod"

// publicToken do booking — não usamos id porque o id é interno
const schema = z.object({
  bookingToken: z.string().min(20).max(64),
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
})

export async function POST(req: NextRequest) {
  // Defesa básica: 20 subscribes/min por IP. Bot que ficar criando
  // subscriptions falsas vai esbarrar aqui.
  const limited = rateLimit(`push-subscribe:${clientIp(req)}`, {
    limit: 20,
    windowMs: 60_000,
  })
  if (!limited.success) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 })
  }

  const { bookingToken, subscription } = parsed.data

  const booking = await db.booking.findUnique({
    where: { publicToken: bookingToken },
    select: { id: true, status: true },
  })
  if (!booking) {
    return NextResponse.json({ error: "booking_not_found" }, { status: 404 })
  }
  if (booking.status === "CANCELLED") {
    return NextResponse.json({ error: "booking_cancelled" }, { status: 410 })
  }

  // Upsert por endpoint: se o mesmo navegador inscreve duas vezes (refresh,
  // troca de browser na mesma máquina), atualiza pro booking certo.
  await db.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    create: {
      bookingId: booking.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    update: { bookingId: booking.id },
  })

  return NextResponse.json({ ok: true })
}
