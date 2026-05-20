import { NextResponse, type NextRequest } from "next/server"

import { getApiOwnerContext } from "@/server/auth/guards"
import { createService } from "@/server/service/mutations"
import { db } from "@/lib/db"
import { createServiceSchema } from "@/lib/validations/service"

export async function GET() {
  const ctx = await getApiOwnerContext()
  if (ctx instanceof NextResponse) return ctx

  const services = await db.service.findMany({
    where: { establishmentId: ctx.establishmentId },
    include: { professionals: { select: { professionalId: true } } },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(services)
}

export async function POST(req: NextRequest) {
  const ctx = await getApiOwnerContext()
  if (ctx instanceof NextResponse) return ctx

  const body = await req.json().catch(() => null)
  const parsed = createServiceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const service = await createService(ctx.establishmentId, parsed.data)
  return NextResponse.json(service, { status: 201 })
}
