import bcrypt from "bcryptjs"

import { formatAddressOneLine } from "@/lib/address"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/email"
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
  const existing = await db.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  })
  if (existing) {
    throw new RegisterError("EMAIL_TAKEN", "Esse e-mail já está em uso")
  }

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

  const passwordHash = await bcrypt.hash(input.password, 10)
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
    // Corrida: alguém usou o slug entre o check e o insert. Postgres unique
    // violation = SQLSTATE 23505.
    const code = (err as { code?: string }).code
    if (code === "23505") {
      throw new RegisterError("SLUG_TAKEN", "Esse endereço já está em uso — escolha outro")
    }
    throw err
  }

  // Email de boas-vindas fire-and-forget. Resend não configurado → loga e
  // ignora (não bloqueia o cadastro).
  void sendWelcomeEmail(result.user, result.establishment)

  return result
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
    html: `
      <p>Olá ${safeName},</p>
      <p><strong>${safeEstName}</strong> já está no ar no Reserve Já.</p>
      ${addressLine ? `<p style="color:#6b7280;font-size:13px;">${safeAddressLine}</p>` : ""}
      <p>Compartilhe esse link com seus clientes pra começarem a agendar:<br>
        <a href="${publicUrl}">${publicUrl}</a>
      </p>
      <p>Acesse o painel pra gerenciar:<br>
        <a href="${panelUrl}">${panelUrl}</a>
      </p>
      <h3>Próximos passos</h3>
      <ol>
        <li><a href="${appUrl}/painel/servicos">Cadastrar serviços</a></li>
        <li><a href="${appUrl}/painel/profissionais">Cadastrar profissionais</a></li>
        <li><a href="${appUrl}/painel/horarios">Ajustar horários de atendimento</a></li>
      </ol>
      <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">
        Esqueceu a senha? Recupere em <a href="${appUrl}/recuperar-senha">${appUrl}/recuperar-senha</a>.
      </p>
    `,
  })
}

