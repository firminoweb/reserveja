import { NextResponse, after, type NextRequest } from "next/server"

import { clientIp, rateLimit } from "@/lib/rate-limit"
import { createBooking, BookingError } from "@/server/booking/create"
import {
  sendBookingConfirmation,
  sendNewBookingToOwners,
} from "@/server/notifications/booking"
import { createBookingSchema } from "@/lib/validations/booking"

export async function POST(req: NextRequest) {
  // 10 bookings/min por IP. Defende contra spam de agenda. Limite generoso porque
  // família compartilhando IP pública (NAT) pode legitimamente criar vários.
  const limited = rateLimit(`booking:${clientIp(req)}`, {
    limit: 10,
    windowMs: 60_000,
  })
  if (!limited.success) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const parsed = createBookingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const booking = await createBooking(parsed.data)

    // Notificação roda depois que a resposta foi enviada — não bloqueia o cliente
    // e qualquer falha de WhatsApp não derruba o booking que já foi gravado.
    after(() => sendBookingConfirmation(booking.id))
    after(() => sendNewBookingToOwners(booking.id))

    return NextResponse.json(
      {
        id: booking.id,
        publicToken: booking.publicToken,
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
        status: booking.status,
      },
      { status: 201 },
    )
  } catch (err) {
    if (err instanceof BookingError) {
      const status = err.code === "SLOT_TAKEN" ? 409 : 400
      return NextResponse.json({ error: err.code, message: err.message }, { status })
    }
    console.error("[api/bookings] erro inesperado", err)
    return NextResponse.json({ error: "internal" }, { status: 500 })
  }
}
