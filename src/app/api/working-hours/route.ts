import { NextResponse, type NextRequest } from "next/server"

import { getApiOwnerContext } from "@/server/auth/guards"
import { saveWorkingHours } from "@/server/workinghours/save"
import { db } from "@/lib/db"
import { saveWorkingHoursSchema } from "@/lib/validations/working-hours"

export async function GET() {
  const ctx = await getApiOwnerContext()
  if (ctx instanceof NextResponse) return ctx

  const hours = await db.workingHour.findMany({
    where: { establishmentId: ctx.establishmentId },
    orderBy: [{ weekday: "asc" }, { startMin: "asc" }],
  })
  return NextResponse.json(hours)
}

export async function PUT(req: NextRequest) {
  const ctx = await getApiOwnerContext()
  if (ctx instanceof NextResponse) return ctx

  const body = await req.json().catch(() => null)
  const parsed = saveWorkingHoursSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const hours = await saveWorkingHours(ctx.establishmentId, parsed.data)
  return NextResponse.json(hours)
}
