import { NextResponse, type NextRequest } from "next/server"

import { getAvailability } from "@/server/booking/availability"
import { availabilityQuerySchema } from "@/lib/validations/booking"

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const parsed = availabilityQuerySchema.safeParse({
    establishmentSlug: url.searchParams.get("establishmentSlug"),
    serviceId: url.searchParams.get("serviceId"),
    professionalId: url.searchParams.get("professionalId") ?? undefined,
    date: url.searchParams.get("date"),
  })

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_query", issues: parsed.error.flatten() }, { status: 400 })
  }

  const slots = await getAvailability(parsed.data)
  return NextResponse.json({ slots })
}
