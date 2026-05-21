"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import type { OrgStatus, Role } from "@prisma/client"

import { auth, signOut } from "@/lib/auth"
import { db } from "@/lib/db"
import { generateTempPassword } from "@/lib/temp-password"
import { requireRole } from "@/server/auth/guards"
import { IMPERSONATE_COOKIE } from "@/server/auth/impersonate"

export async function signOutAction() {
  await signOut({ redirectTo: "/" })
}

type Result<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; message: string }

export async function changeUserRoleAction(
  userId: string,
  next: Role,
): Promise<Result> {
  const session = await requireRole("ADMIN")
  if (session.user.id === userId && next !== "ADMIN") {
    return { ok: false, message: "Você não pode rebaixar a si mesmo" }
  }
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  })
  if (!user) return { ok: false, message: "Usuário não encontrado" }
  if (user.role === next) return { ok: true }

  await db.user.update({ where: { id: userId }, data: { role: next } })
  revalidatePath("/admin/usuarios")
  return { ok: true }
}

export async function resetUserPasswordAction(
  userId: string,
): Promise<Result<{ tempPassword: string }>> {
  await requireRole("ADMIN")
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  })
  if (!user) return { ok: false, message: "Usuário não encontrado" }

  const tempPassword = generateTempPassword()
  const passwordHash = await bcrypt.hash(tempPassword, 12)
  await db.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: true },
  })
  // Invalida tokens de reset pendentes — segurança.
  await db.passwordResetToken.deleteMany({
    where: { userId, usedAt: null },
  })
  revalidatePath("/admin/usuarios")
  return { ok: true, data: { tempPassword } }
}

/**
 * Admin assume identidade de outro usuário. Próximas requisições passam por
 * `getEffectiveSession` que retorna o usuário alvo. Só ADMIN pode iniciar.
 * Se o alvo for OWNER, depois redireciona pra /painel.
 */
export async function impersonateUserAction(
  targetUserId: string,
): Promise<{ ok: false; message: string }> {
  // Usa session real (não a efetiva) — admin precisa ter a role admin de fato.
  const realSession = await auth()
  if (!realSession?.user || realSession.user.role !== "ADMIN") {
    return { ok: false, message: "Apenas admin pode impersonar" }
  }
  if (targetUserId === realSession.user.id) {
    return { ok: false, message: "Não faz sentido impersonar a si mesmo" }
  }

  const target = await db.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, role: true, email: true },
  })
  if (!target) {
    return { ok: false, message: "Usuário não encontrado" }
  }

  const jar = await cookies()
  jar.set(IMPERSONATE_COOKIE, target.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 2, // 2h
  })

  // Trilha de auditoria persistente — não confiar em stdout/logs de plataforma.
  await db.auditLog.create({
    data: {
      actorId: realSession.user.id,
      targetUserId: target.id,
      action: "IMPERSONATE_START",
      metadata: { actorEmail: realSession.user.email, targetEmail: target.email },
    },
  })

  // Redireciona pra área natural do alvo. Throw NEXT_REDIRECT — server action
  // exit normal.
  redirect(target.role === "ADMIN" ? "/admin" : "/painel")
}

export async function stopImpersonatingAction(): Promise<void> {
  const jar = await cookies()
  const targetId = jar.get(IMPERSONATE_COOKIE)?.value
  jar.delete(IMPERSONATE_COOKIE)
  const realSession = await auth()
  if (realSession?.user && targetId) {
    await db.auditLog.create({
      data: {
        actorId: realSession.user.id,
        targetUserId: targetId,
        action: "IMPERSONATE_STOP",
        metadata: { actorEmail: realSession.user.email },
      },
    })
  }
  redirect("/admin")
}

export async function setOrganizationStatusAction(
  organizationId: string,
  next: OrgStatus,
): Promise<Result> {
  await requireRole("ADMIN")
  const org = await db.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, status: true },
  })
  if (!org) return { ok: false, message: "Empresa não encontrada" }
  if (org.status === next) return { ok: true }

  await db.organization.update({
    where: { id: organizationId },
    data: { status: next },
  })
  revalidatePath("/admin/estabelecimentos")
  revalidatePath(`/admin/estabelecimentos/${organizationId}`)
  return { ok: true }
}
