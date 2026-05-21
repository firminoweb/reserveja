"use server"

import { rateLimit } from "@/lib/rate-limit"
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

  // Limita o flooding de emails (Resend cobra por envio): 3 por hora por endereço.
  const limited = rateLimit(`pwreset:${parsed.data.email.toLowerCase()}`, {
    limit: 3,
    windowMs: 60 * 60 * 1000,
  })
  if (!limited.success) {
    // Mantém aparência de sucesso (anti-enumeration). Só evita o envio real.
    return { ok: true }
  }

  try {
    await requestPasswordReset(parsed.data.email)
  } catch (err) {
    console.error("[recuperar-senha] requestPasswordReset falhou", err)
    // Não vaza erro pro cliente — mesma resposta de sucesso (evita enumeração).
  }

  return { ok: true }
}
