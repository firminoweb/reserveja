import { NextResponse, type NextRequest } from "next/server"

import { db } from "@/lib/db"
import { formatAddressOneLine } from "@/lib/address"
import { buildIcs } from "@/lib/ics"

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000"
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params

  const booking = await db.booking.findUnique({
    where: { publicToken: token },
    include: {
      service: { select: { name: true } },
      professional: { select: { name: true } },
      establishment: {
        select: {
          slug: true,
          name: true,
          timezone: true,
          street: true,
          streetNumber: true,
          neighborhood: true,
          city: true,
          state: true,
        },
      },
    },
  })

  if (!booking) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  const link = `${appUrl()}/${booking.establishment.slug}/b/${booking.publicToken}`
  const addressLine = formatAddressOneLine(booking.establishment)
  const isCancelled = booking.status === "CANCELLED"

  const ics = buildIcs({
    uid: booking.publicToken,
    sequence: isCancelled ? 1 : 0,
    method: isCancelled ? "CANCEL" : "REQUEST",
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    timezone: booking.establishment.timezone,
    summary: `${booking.service.name} — ${booking.establishment.name}`,
    description: `Agendamento com ${booking.professional.name}.\n\nGerencie: ${link}`,
    location: addressLine || undefined,
    url: link,
    organizerName: booking.establishment.name,
    attendeeEmail: booking.clientEmail ?? "cliente@reserveja.app",
    attendeeName: booking.clientName,
  })

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="agendamento-${booking.publicToken.slice(0, 8)}.ics"`,
      "Cache-Control": "no-store",
    },
  })
}
