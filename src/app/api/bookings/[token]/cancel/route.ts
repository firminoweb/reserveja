import { NextResponse, type NextRequest } from "next/server"

import { cancelBookingByToken } from "@/server/booking/cancel"

export async function PATCH(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params
  const booking = await cancelBookingByToken(token, "CLIENT")

  if (!booking) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  return NextResponse.json({ id: booking.id, status: booking.status })
}
