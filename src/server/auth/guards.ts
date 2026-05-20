import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { NextResponse } from "next/server"
import type { Role } from "@prisma/client"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

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

export async function requireSession() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  return session
}

export async function requireRole(role: Role) {
  const session = await requireSession()
  if (session.user.role !== role) redirect("/")
  return session
}

/**
 * Para rotas do painel: sessão + organização + lista de unidades a que esse
 * usuário tem acesso + a unidade "atualmente selecionada" (cookie rj_unit).
 *
 * Sem linhas em MembershipUnit pra essa membership → acesso total (caso
 * default do OWNER). Com linhas → restrito às listadas.
 */
export async function requireOwnerMembership() {
  const session = await requireSession()

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
  const session = await auth()
  if (!session?.user) {
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
