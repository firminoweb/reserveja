import { NextResponse, type NextRequest } from "next/server"

import { db } from "@/lib/db"

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const url = new URL(_req.url)
  const serviceId = url.searchParams.get("serviceId") ?? undefined

  const professionals = await db.professional.findMany({
    where: {
      active: true,
      establishment: {
        slug,
        organization: { status: { not: "SUSPENDED" } },
      },
      ...(serviceId ? { services: { some: { serviceId } } } : {}),
    },
    select: {
      id: true,
      name: true,
      photoUrl: true,
      services: { select: { serviceId: true } },
    },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(professionals)
}
