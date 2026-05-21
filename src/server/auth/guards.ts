import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { NextResponse } from "next/server"
import type { Role } from "@prisma/client"

import { db } from "@/lib/db"
import { getEffectiveSession } from "@/server/auth/impersonate"

export const UNIT_COOKIE = "rj_unit"

/**
 * Garante que o usuário tem role OWNER na membership atual. Redireciona STAFF
 * pra /painel (home) silenciosamente. Use em páginas owner-only (equipe,
 * configurações de empresa, criação de unidades).
 */
export async function requireOwnerRole() {
  const ctx = await requireOwnerMembership()
  if (ctx.role !== "OWNER") redirect("/painel")
  return ctx
}

/**
 * Retorna sessão "efetiva" — se admin estiver impersonando, retorna o usuário
 * alvo (mais campo `impersonatedBy` populado pro banner).
 */
export async function requireSession() {
  const session = await getEffectiveSession()
  if (!session) redirect("/login")
  return session
}

export async function requireRole(role: Role) {
  const session = await requireSession()
  if (session.user.role !== role) redirect("/")
  return session
}

export async function requireOwnerMembership() {
  const session = await requireSession()

  // ADMIN não tem Membership e não deve cair no fluxo de cadastro de empresa.
  // Mandar pra /admin (área dele) — evita loop /painel → /cadastro → /painel.
  if (session.user.role === "ADMIN") redirect("/admin")

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    include: {
      organization: true,
      units: { select: { establishmentId: true } },
    },
    orderBy: { createdAt: "asc" },
  })
  if (!membership) redirect("/cadastro")

  const restricted = membership.units.length > 0
  const allowedIds = restricted ? membership.units.map((u) => u.establishmentId) : null

  const establishments = await db.establishment.findMany({
    where: {
      organizationId: membership.organizationId,
      ...(allowedIds ? { id: { in: allowedIds } } : {}),
    },
    orderBy: { createdAt: "asc" },
  })
  if (establishments.length === 0) redirect("/cadastro")

  const jar = await cookies()
  const selectedId = jar.get(UNIT_COOKIE)?.value
  const selected = establishments.find((e) => e.id === selectedId)

  return {
    session,
    membership,
    organization: membership.organization,
    establishment: selected ?? establishments[0],
    establishments,
    role: membership.role,
  }
}

/**
 * Versão de API: retorna ctx ou NextResponse de erro pronta. Não usa redirect.
 * Mesma lógica de cookie + per-unit ACL.
 */
export async function getApiOwnerContext() {
  const session = await getEffectiveSession()
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    include: { units: { select: { establishmentId: true } } },
    orderBy: { createdAt: "asc" },
  })
  if (!membership) {
    return NextResponse.json({ error: "no_membership" }, { status: 403 })
  }

  const restricted = membership.units.length > 0
  const allowedIds = restricted ? membership.units.map((u) => u.establishmentId) : null

  const establishments = await db.establishment.findMany({
    where: {
      organizationId: membership.organizationId,
      ...(allowedIds ? { id: { in: allowedIds } } : {}),
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  })
  if (establishments.length === 0) {
    return NextResponse.json({ error: "no_units" }, { status: 403 })
  }

  const jar = await cookies()
  const selectedId = jar.get(UNIT_COOKIE)?.value
  const selected = establishments.find((e) => e.id === selectedId)

  return {
    userId: session.user.id,
    organizationId: membership.organizationId,
    establishmentId: (selected ?? establishments[0]).id,
  }
}
