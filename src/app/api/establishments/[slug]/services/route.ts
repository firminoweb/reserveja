import { NextResponse, type NextRequest } from "next/server"

import { db } from "@/lib/db"

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const services = await db.service.findMany({
    where: {
      active: true,
      establishment: { slug },
    },
    select: {
      id: true,
      name: true,
      description: true,
      durationMin: true,
      priceCents: true,
    },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(services)
}
