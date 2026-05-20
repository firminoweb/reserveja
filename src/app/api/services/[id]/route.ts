import { NextResponse, type NextRequest } from "next/server"

import { getApiOwnerContext } from "@/server/auth/guards"
import { ServiceError, deleteService, updateService } from "@/server/service/mutations"
import { updateServiceSchema } from "@/lib/validations/service"

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/services/[id]">) {
  const owner = await getApiOwnerContext()
  if (owner instanceof NextResponse) return owner

  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  const parsed = updateServiceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const service = await updateService(owner.establishmentId, id, parsed.data)
    return NextResponse.json(service)
  } catch (err) {
    if (err instanceof ServiceError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 404 })
    }
    throw err
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/services/[id]">) {
  const owner = await getApiOwnerContext()
  if (owner instanceof NextResponse) return owner

  const { id } = await ctx.params

  try {
    await deleteService(owner.establishmentId, id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof ServiceError) {
      const status = err.code === "HAS_BOOKINGS" ? 409 : 404
      return NextResponse.json({ error: err.code, message: err.message }, { status })
    }
    throw err
  }
}
