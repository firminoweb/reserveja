import { NextResponse, type NextRequest } from "next/server"

import { db } from "@/lib/db"

export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params
  const booking = await db.booking.findUnique({
    where: { publicToken: token },
    select: {
      id: true,
      publicToken: true,
      clientName: true,
      // clientPhone intencionalmente omitido — minimização de PII (LGPD).
      // Endpoint público (basta o token na URL) não deve vazar telefone do cliente.
      startsAt: true,
      endsAt: true,
      status: true,
      cancelledAt: true,
      notes: true,
      service: { select: { id: true, name: true, durationMin: true, priceCents: true } },
      professional: { select: { id: true, name: true, photoUrl: true } },
      establishment: { select: { slug: true, name: true, whatsapp: true, timezone: true } },
    },
  })

  if (!booking) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  return NextResponse.json(booking)
}
