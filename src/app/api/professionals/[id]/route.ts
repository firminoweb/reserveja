import { NextResponse, type NextRequest } from "next/server"

import { getApiOwnerContext } from "@/server/auth/guards"
import {
  ProfessionalError,
  deleteProfessional,
  updateProfessional,
} from "@/server/professional/mutations"
import { updateProfessionalSchema } from "@/lib/validations/professional"

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/professionals/[id]">,
) {
  const owner = await getApiOwnerContext()
  if (owner instanceof NextResponse) return owner

  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  const parsed = updateProfessionalSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const professional = await updateProfessional(owner.establishmentId, id, parsed.data)
    return NextResponse.json(professional)
  } catch (err) {
    if (err instanceof ProfessionalError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 404 })
    }
    throw err
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/professionals/[id]">,
) {
  const owner = await getApiOwnerContext()
  if (owner instanceof NextResponse) return owner

  const { id } = await ctx.params

  try {
    await deleteProfessional(owner.establishmentId, id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof ProfessionalError) {
      const status = err.code === "HAS_BOOKINGS" ? 409 : 404
      return NextResponse.json({ error: err.code, message: err.message }, { status })
    }
    throw err
  }
}
