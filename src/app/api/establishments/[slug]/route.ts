import { NextResponse, type NextRequest } from "next/server"

import { db } from "@/lib/db"

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const establishment = await db.establishment.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      whatsapp: true,
      timezone: true,
      logoUrl: true,
      coverUrl: true,
      organization: {
        select: { status: true, category: true },
      },
    },
  })

  if (!establishment || establishment.organization.status === "SUSPENDED") {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  const { organization, ...rest } = establishment
  return NextResponse.json({
    ...rest,
    status: organization.status,
    category: organization.category,
  })
}
