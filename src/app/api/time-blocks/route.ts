import { NextResponse, type NextRequest } from "next/server"

import { getApiOwnerContext } from "@/server/auth/guards"
import { TimeBlockError, createTimeBlock } from "@/server/timeblock/mutations"
import { db } from "@/lib/db"
import { createTimeBlockSchema } from "@/lib/validations/time-block"

export async function GET() {
  const ctx = await getApiOwnerContext()
  if (ctx instanceof NextResponse) return ctx

  const blocks = await db.timeBlock.findMany({
    where: { establishmentId: ctx.establishmentId, endsAt: { gte: new Date() } },
    include: { professional: { select: { id: true, name: true } } },
    orderBy: { startsAt: "asc" },
  })
  return NextResponse.json(blocks)
}

export async function POST(req: NextRequest) {
  const ctx = await getApiOwnerContext()
  if (ctx instanceof NextResponse) return ctx

  const body = await req.json().catch(() => null)
  const parsed = createTimeBlockSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const block = await createTimeBlock(ctx.establishmentId, parsed.data)
    return NextResponse.json(block, { status: 201 })
  } catch (err) {
    if (err instanceof TimeBlockError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
    }
    throw err
  }
}
