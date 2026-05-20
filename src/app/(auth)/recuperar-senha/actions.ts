"use server"

import { requestResetSchema, type RequestResetInput } from "@/lib/validations/password-reset"
import { requestPasswordReset } from "@/server/auth/password-reset"

type ActionResult =
  | { ok: true }
  | { ok: false; field?: keyof RequestResetInput; message: string }

export async function requestResetAction(input: RequestResetInput): Promise<ActionResult> {
  const parsed = requestResetSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      ok: false,
      field: first?.path[0] as keyof RequestResetInput | undefined,
      message: first?.message ?? "Dados inválidos",
    }
  }

  try {
    await requestPasswordReset(parsed.data.email)
  } catch (err) {
    console.error("[recuperar-senha] requestPasswordReset falhou", err)
    // Não vaza erro pro cliente — mesma resposta de sucesso (evita enumeração).
  }

  return { ok: true }
}
