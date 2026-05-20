"use server"

import { confirmResetSchema, type ConfirmResetInput } from "@/lib/validations/password-reset"
import {
  PasswordResetError,
  confirmPasswordReset,
} from "@/server/auth/password-reset"

type ActionResult =
  | { ok: true }
  | { ok: false; field?: keyof ConfirmResetInput; message: string }

export async function confirmResetAction(input: ConfirmResetInput): Promise<ActionResult> {
  const parsed = confirmResetSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      ok: false,
      field: first?.path[0] as keyof ConfirmResetInput | undefined,
      message: first?.message ?? "Dados inválidos",
    }
  }

  try {
    await confirmPasswordReset(parsed.data.token, parsed.data.password)
  } catch (err) {
    if (err instanceof PasswordResetError) {
      return { ok: false, message: err.message }
    }
    console.error("[redefinir-senha] confirmPasswordReset falhou", err)
    return { ok: false, message: "Não foi possível redefinir. Tente de novo." }
  }

  return { ok: true }
}
