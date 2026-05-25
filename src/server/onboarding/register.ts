import bcrypt from "bcryptjs"

import { formatAddressOneLine } from "@/lib/address"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/email"
import { emailButton, emailLayout, emailMuted } from "@/lib/email-template"
import { isPasswordLeaked } from "@/lib/hibp"
import { toE164BR } from "@/lib/phone"
import { slugify } from "@/lib/slug"
import { taxIdDigits } from "@/lib/tax"
import { cepDigits } from "@/lib/viacep"
import type { SignUpInput } from "@/lib/validations/auth"

export class RegisterError extends Error {
  constructor(
    public code: "EMAIL_TAKEN" | "SLUG_TAKEN" | "PASSWORD_LEAKED",
    message: string,
  ) {
    super(message)
  }
}

// seg-sáb 9h-19h. Domingo fechado.
const DEFAULT_WORKING_HOURS = [1, 2, 3, 4, 5, 6].map((weekday) => ({
  weekday,
  startMin: 9 * 60,
  endMin: 19 * 60,
}))

export async function isSlugAvailable(slug: string): Promise<boolean> {
  const normalized = slugify(slug)
  if (normalized.length < 3) return false
  const existing = await db.establishment.findUnique({
    where: { slug: normalized },
    select: { id: true },
  })
  return !existing
}

export async function registerOwner(input: SignUpInput) {
  const slug = slugify(input.slug)
  const slugFree = await isSlugAvailable(slug)
  if (!slugFree) {
    throw new RegisterError("SLUG_TAKEN", "Esse endereço já está em uso — escolha outro")
  }

  if (await isPasswordLeaked(input.password)) {
    throw new RegisterError(
      "PASSWORD_LEAKED",
      "Essa senha aparece em vazamentos conhecidos. Escolha outra.",
    )
  }

  // Email duplicado é detectado abaixo via unique constraint do Postgres (23505).
  // Não checamos antes pra não vazar via timing/resposta se o email já existe
  // (anti-enumeration). Se o cadastro falhar por duplicidade, devolvemos a
  // mesma mensagem genérica que daríamos em sucesso e enviamos um email pro
  // endereço informado dizendo "já existe conta — faça login".

  const passwordHash = await bcrypt.hash(input.password, 12)
  const whatsappE164 = toE164BR(input.whatsapp)!
  const taxId = input.taxId ? taxIdDigits(input.taxId) : null

  let result: {
    user: { id: string; email: string; name: string }
    organization: { id: string; name: string }
    establishment: {
      id: string
      slug: string
      name: string
      street: string | null
      streetNumber: string | null
      neighborhood: string | null
      city: string | null
      state: string | null
    }
  }

  try {
    result = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          name: input.name,
          role: "OWNER",
        },
      })

      const organization = await tx.organization.create({
        data: {
          name: input.establishmentName,
          type: input.type,
          category: input.category,
          taxId,
          status: "TRIAL",
          memberships: { create: { userId: newUser.id, role: "OWNER" } },
          establishments: {
            create: {
              slug,
              name: input.establishmentName,
              whatsapp: whatsappE164,
              cep: cepDigits(input.cep),
              street: input.street,
              streetNumber: input.streetNumber,
              complement: input.complement?.trim() || null,
              neighborhood: input.neighborhood,
              city: input.city,
              state: input.state,
              workingHours: { createMany: { data: DEFAULT_WORKING_HOURS } },
            },
          },
        },
        include: { establishments: true },
      })

      return {
        user: newUser,
        organization,
        establishment: organization.establishments[0],
      }
    })
  } catch (err: unknown) {
    // Postgres unique violation = SQLSTATE 23505. Tanto slug duplicado quanto
    // email duplicado caem aqui. Como o slug já foi pré-checado acima, o caso
    // comum é email duplicado.
    const code = (err as { code?: string }).code
    const meta = (err as { meta?: { target?: string[] | string } }).meta
    const targetStr = Array.isArray(meta?.target) ? meta.target.join(",") : meta?.target ?? ""
    if (code === "23505") {
      if (targetStr.includes("slug")) {
        throw new RegisterError("SLUG_TAKEN", "Esse endereço já está em uso — escolha outro")
      }
      // Email já cadastrado: dispara email "já existe conta" e devolve EMAIL_TAKEN
      // como sinal genérico — a UI deve mostrar mensagem que não confirme nem nega
      // a existência do email pro atacante (ex.: "Conta criada. Verifique seu email").
      void sendExistingAccountEmail(input.email)
      throw new RegisterError("EMAIL_TAKEN", "Não foi possível concluir o cadastro com esses dados.")
    }
    throw err
  }

  // Email de boas-vindas fire-and-forget. Resend não configurado → loga e
  // ignora (não bloqueia o cadastro).
  void sendWelcomeEmail(result.user, result.establishment)

  return result
}

async function sendExistingAccountEmail(email: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  try {
    await sendEmail({
      to: email,
      subject: "Tentativa de cadastro no Reserve Já",
      text: [
        `Alguém (talvez você) tentou criar uma nova conta no Reserve Já com este email.`,
        ``,
        `Já existe uma conta com esse endereço. Se foi você:`,
        `- Faça login em ${appUrl}/login`,
        `- Esqueceu a senha? ${appUrl}/recuperar-senha`,
        ``,
        `Se não foi você, pode ignorar este email — nada foi alterado na sua conta.`,
      ].join("\n"),
      html: emailLayout([
        `<p>Alguém (talvez você) tentou criar uma nova conta no Reserve Já com este email.</p>`,
        `<p>Já existe uma conta com esse endereço. Se foi você:</p>`,
        `<p style="text-align:center;margin:24px 0">${emailButton(`${appUrl}/login`, "Fazer login")}</p>`,
        `<p style="font-size:13px;color:#6b7280">Esqueceu a senha? <a href="${appUrl}/recuperar-senha" style="color:#4F46E5">Recuperar senha</a></p>`,
        emailMuted("Se não foi você, pode ignorar — nada foi alterado na sua conta."),
      ].join("")),
    })
  } catch {
    // Fail-open. Envio de email é best-effort.
  }
}

async function sendWelcomeEmail(
  user: { email: string; name: string },
  establishment: {
    slug: string
    name: string
    street: string | null
    streetNumber: string | null
    neighborhood: string | null
    city: string | null
    state: string | null
  },
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const publicUrl = `${appUrl}/${establishment.slug}`
  const panelUrl = `${appUrl}/painel`
  const safeName = user.name.replace(/</g, "&lt;")
  const safeEstName = establishment.name.replace(/</g, "&lt;")

  const addressLine = formatAddressOneLine(establishment)
  const safeAddressLine = addressLine.replace(/</g, "&lt;")

  await sendEmail({
    to: user.email,
    subject: `Bem-vindo ao Reserve Já — ${establishment.name} no ar`,
    text: [
      `Olá ${user.name},`,
      ``,
      `${establishment.name} já está no ar no Reserve Já.`,
      addressLine ? `Endereço cadastrado: ${addressLine}` : "",
      ``,
      `Link público pros seus clientes agendarem:`,
      publicUrl,
      ``,
      `Painel de gestão:`,
      panelUrl,
      ``,
      `Próximos passos:`,
      `  1. Cadastrar serviços (${appUrl}/painel/servicos)`,
      `  2. Cadastrar profissionais (${appUrl}/painel/profissionais)`,
      `  3. Ajustar horários (${appUrl}/painel/horarios)`,
      ``,
      `Esqueceu a senha? ${appUrl}/recuperar-senha`,
    ]
      .filter(Boolean)
      .join("\n"),
    html: emailLayout([
      `<p>Olá <strong>${safeName}</strong>,</p>`,
      `<p><strong>${safeEstName}</strong> já está no ar no Reserve Já!</p>`,
      addressLine ? `<p style="color:#6b7280;font-size:13px">${safeAddressLine}</p>` : "",
      `<p>Compartilhe este link com seus clientes:<br><a href="${publicUrl}" style="color:#4F46E5;word-break:break-all">${publicUrl}</a></p>`,
      `<p style="text-align:center;margin:24px 0">${emailButton(panelUrl, "Acessar o painel")}</p>`,
      `<p style="font-size:14px;font-weight:600;margin-bottom:8px">Próximos passos:</p>`,
      `<ol style="padding-left:20px;font-size:14px;line-height:1.8">`,
      `  <li><a href="${appUrl}/painel/servicos" style="color:#4F46E5">Cadastrar serviços</a></li>`,
      `  <li><a href="${appUrl}/painel/profissionais" style="color:#4F46E5">Cadastrar profissionais</a></li>`,
      `  <li><a href="${appUrl}/painel/horarios" style="color:#4F46E5">Ajustar horários de atendimento</a></li>`,
      `</ol>`,
      emailMuted(`Esqueceu a senha? <a href="${appUrl}/recuperar-senha" style="color:#4F46E5">Recuperar senha</a>`),
    ].filter(Boolean).join("")),
  })
}

