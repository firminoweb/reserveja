import { createHash, randomBytes } from "node:crypto"
import bcrypt from "bcryptjs"
import { addMinutes } from "date-fns"

import { db } from "@/lib/db"
import { sendEmail } from "@/lib/email"
import { isPasswordLeaked } from "@/lib/hibp"

const TOKEN_TTL_MIN = 60

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex")
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000"
}

export class PasswordResetError extends Error {
  constructor(
    public code: "INVALID_TOKEN" | "EXPIRED" | "ALREADY_USED" | "PASSWORD_LEAKED",
    message: string,
  ) {
    super(message)
  }
}

/**
 * Inicia o fluxo: se o email existe, gera token e envia. Sempre retorna sem
 * revelar se o email está cadastrado (evita enumeração).
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase()
  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, name: true, email: true },
  })

  // Sem usuário: retorna em silêncio (mesma latência ainda não é constante,
  // mas pelo menos não exibimos sinal pro chamador).
  if (!user) return

  const rawToken = randomBytes(32).toString("base64url")
  const expiresAt = addMinutes(new Date(), TOKEN_TTL_MIN)

  await db.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashToken(rawToken), expiresAt },
  })

  const link = `${appUrl()}/redefinir-senha?token=${rawToken}`

  await sendEmail({
    to: user.email,
    subject: "Redefinir sua senha — Reserve Já",
    text: [
      `Olá ${user.name},`,
      ``,
      `Recebemos um pedido pra redefinir sua senha no Reserve Já. Se foi você, abra o link abaixo (válido por ${TOKEN_TTL_MIN} min):`,
      ``,
      link,
      ``,
      `Se não foi você, pode ignorar este email — sua senha continua a mesma.`,
    ].join("\n"),
    html: `
      <p>Olá ${escapeHtml(user.name)},</p>
      <p>Recebemos um pedido pra redefinir sua senha no <strong>Reserve Já</strong>. Se foi você, clique no botão abaixo (válido por ${TOKEN_TTL_MIN} min):</p>
      <p><a href="${link}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;border-radius:6px;text-decoration:none">Redefinir senha</a></p>
      <p>Ou copie esse link:<br><a href="${link}">${link}</a></p>
      <p style="color:#666;font-size:14px;margin-top:24px">Se não foi você, pode ignorar este email — sua senha continua a mesma.</p>
    `,
  })
}

export async function confirmPasswordReset(rawToken: string, newPassword: string) {
  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { user: { select: { id: true } } },
  })
  if (!record) throw new PasswordResetError("INVALID_TOKEN", "Link inválido")
  if (record.usedAt) throw new PasswordResetError("ALREADY_USED", "Esse link já foi usado")
  if (record.expiresAt < new Date()) {
    throw new PasswordResetError("EXPIRED", "Link expirado — solicite um novo")
  }

  if (await isPasswordLeaked(newPassword)) {
    throw new PasswordResetError(
      "PASSWORD_LEAKED",
      "Essa senha aparece em vazamentos conhecidos. Escolha outra.",
    )
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)

  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: { passwordHash, mustChangePassword: false },
    }),
    db.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    // Limpa qualquer outro token pendente do usuário pra não dar pra reusar.
    db.passwordResetToken.deleteMany({
      where: { userId: record.userId, usedAt: null, id: { not: record.id } },
    }),
  ])
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
