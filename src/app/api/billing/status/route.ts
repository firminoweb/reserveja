import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { getApiOwnerContext } from "@/server/auth/guards"

export async function GET() {
  const ctx = await getApiOwnerContext()
  if (ctx instanceof NextResponse) return ctx

  const org = await db.organization.findUnique({
    where: { id: ctx.organizationId },
    select: { plan: true, asaasPendingPlan: true, status: true },
  })

  if (!org) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }

  return NextResponse.json({
    plan: org.plan,
    pendingPlan: org.asaasPendingPlan,
    status: org.status,
  })
}
