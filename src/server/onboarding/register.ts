import bcrypt from "bcryptjs"

import { db } from "@/lib/db"
import { isPasswordLeaked } from "@/lib/hibp"
import { toE164BR } from "@/lib/phone"
import { slugify } from "@/lib/slug"
import { taxIdDigits } from "@/lib/tax"
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

  try {
    return await db.$transaction(async (tx) => {
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
}
