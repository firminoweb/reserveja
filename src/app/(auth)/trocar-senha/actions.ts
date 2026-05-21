"use server"

import bcrypt from "bcryptjs"

import { db } from "@/lib/db"
import { isPasswordLeaked } from "@/lib/hibp"
import { rateLimit } from "@/lib/rate-limit"
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validations/password-reset"
import { requireSession } from "@/server/auth/guards"

type ActionResult =
  | { ok: true; redirectTo: string }
  | { ok: false; field?: keyof ChangePasswordInput; message: string }

export async function changePasswordAction(
  input: ChangePasswordInput,
): Promise<ActionResult> {
  const session = await requireSession()

  const parsed = changePasswordSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      ok: false,
      field: first?.path[0] as keyof ChangePasswordInput | undefined,
      message: first?.message ?? "Dados inválidos",
    }
  }

  // Rate limit por user: 10 tentativas / 10 min. Evita brute-force da senha
  // atual via essa rota autenticada.
  const limited = rateLimit(`changepw:${session.user.id}`, {
    limit: 10,
    windowMs: 10 * 60_000,
  })
  if (!limited.success) {
    return { ok: false, message: "Muitas tentativas. Tente de novo daqui a alguns minutos." }
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true, role: true },
  })
  if (!user) {
    return { ok: false, message: "Sessão inválida" }
  }

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)
  if (!ok) {
    return { ok: false, field: "currentPassword", message: "Senha atual incorreta" }
  }

  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return {
      ok: false,
      field: "newPassword",
      message: "A nova senha precisa ser diferente da atual",
    }
  }

  if (await isPasswordLeaked(parsed.data.newPassword)) {
    return {
      ok: false,
      field: "newPassword",
      message: "Essa senha aparece em vazamentos conhecidos. Escolha outra.",
    }
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12)
  await db.user.update({
    where: { id: session.user.id },
    data: { passwordHash, mustChangePassword: false },
  })

  return {
    ok: true,
    redirectTo: user.role === "ADMIN" ? "/admin" : "/painel",
  }
}
