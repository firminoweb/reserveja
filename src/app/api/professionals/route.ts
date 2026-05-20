import { NextResponse, type NextRequest } from "next/server"

import { getApiOwnerContext } from "@/server/auth/guards"
import { ProfessionalError, createProfessional } from "@/server/professional/mutations"
import { db } from "@/lib/db"
import { createProfessionalSchema } from "@/lib/validations/professional"

export async function GET() {
  const ctx = await getApiOwnerContext()
  if (ctx instanceof NextResponse) return ctx

  const professionals = await db.professional.findMany({
    where: { establishmentId: ctx.establishmentId },
    include: { services: { select: { serviceId: true } } },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(professionals)
}

export async function POST(req: NextRequest) {
  const ctx = await getApiOwnerContext()
  if (ctx instanceof NextResponse) return ctx

  const body = await req.json().catch(() => null)
  const parsed = createProfessionalSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const professional = await createProfessional(ctx.establishmentId, parsed.data)
    return NextResponse.json(professional, { status: 201 })
  } catch (err) {
    if (err instanceof ProfessionalError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
    }
    throw err
  }
}
