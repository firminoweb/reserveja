import { NextResponse, type NextRequest } from "next/server"

import { getApiOwnerContext } from "@/server/auth/guards"
import { TimeBlockError, deleteTimeBlock } from "@/server/timeblock/mutations"

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const owner = await getApiOwnerContext()
  if (owner instanceof NextResponse) return owner

  const { id } = await ctx.params

  try {
    await deleteTimeBlock(owner.establishmentId, id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof TimeBlockError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 404 })
    }
    throw err
  }
}
