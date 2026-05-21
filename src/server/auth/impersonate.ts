import { cookies } from "next/headers"
import type { Role } from "@prisma/client"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export const IMPERSONATE_COOKIE = "rj_impersonate"

export type EffectiveUser = {
  id: string
  email: string
  name: string
  role: Role
}

export type EffectiveSession = {
  user: EffectiveUser
  /** Quando preenchido = admin atuando como outro usuário. */
  impersonatedBy: { id: string; email: string; name: string } | null
}

/**
 * Sessão "efetiva" — se o usuário real é ADMIN e tem cookie de impersonation
 * válido, retorna o usuário alvo. Caso contrário retorna o usuário real.
 *
 * Mesmo que alguém forje o cookie, só funciona se a sessão real for ADMIN.
 */
export async function getEffectiveSession(): Promise<EffectiveSession | null> {
  const session = await auth()
  if (!session?.user) return null

  const realUser = {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? "",
    role: session.user.role,
  }

  if (realUser.role !== "ADMIN") {
    return { user: realUser, impersonatedBy: null }
  }

  const jar = await cookies()
  const targetId = jar.get(IMPERSONATE_COOKIE)?.value
  if (!targetId || targetId === realUser.id) {
    return { user: realUser, impersonatedBy: null }
  }

  const target = await db.user.findUnique({
    where: { id: targetId },
    select: { id: true, email: true, name: true, role: true },
  })
  if (!target) {
    return { user: realUser, impersonatedBy: null }
  }

  return {
    user: target,
    impersonatedBy: {
      id: realUser.id,
      email: realUser.email,
      name: realUser.name,
    },
  }
}
