import { NextResponse, after, type NextRequest } from "next/server"

import { createBooking, BookingError } from "@/server/booking/create"
import { sendBookingConfirmation } from "@/server/notifications/booking"
import { createBookingSchema } from "@/lib/validations/booking"

export async function POST(req: NextRequest) {
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
