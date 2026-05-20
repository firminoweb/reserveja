import { db } from "@/lib/db"
import { slugify } from "@/lib/slug"

export class EstablishmentCreateError extends Error {
  constructor(
    public code: "SLUG_TAKEN" | "PLAN_LIMIT" | "ORG_NOT_FOUND",
    message: string,
  ) {
    super(message)
  }
}

type CreateInput = {
  organizationId: string
  slug: string
  name: string
  whatsapp: string
  timezone?: string
}

// seg-sáb 9h-19h, default copiado pra qualquer unidade nova.
const DEFAULT_WORKING_HOURS = [1, 2, 3, 4, 5, 6].map((weekday) => ({
  weekday,
  startMin: 9 * 60,
  endMin: 19 * 60,
}))

export async function createEstablishment(input: CreateInput) {
  const organization = await db.organization.findUnique({
    where: { id: input.organizationId },
    select: {
      id: true,
      planLimitUnits: true,
      _count: { select: { establishments: true } },
    },
  })
  if (!organization) {
    throw new EstablishmentCreateError("ORG_NOT_FOUND", "Empresa não encontrada")
  }

  if (organization._count.establishments >= organization.planLimitUnits) {
    throw new EstablishmentCreateError(
      "PLAN_LIMIT",
      `Plano atual permite ${organization.planLimitUnits} unidade(s)`,
    )
  }

  const slug = slugify(input.slug)
  const taken = await db.establishment.findUnique({
    where: { slug },
    select: { id: true },
  })
  if (taken) {
    throw new EstablishmentCreateError("SLUG_TAKEN", "Esse endereço já está em uso")
  }

  try {
    return await db.establishment.create({
      data: {
        organizationId: input.organizationId,
        slug,
        name: input.name,
        whatsapp: input.whatsapp,
        timezone: input.timezone ?? "America/Sao_Paulo",
        workingHours: { createMany: { data: DEFAULT_WORKING_HOURS } },
      },
    })
  } catch (err: unknown) {
    const code = (err as { code?: string }).code
    if (code === "23505") {
      throw new EstablishmentCreateError("SLUG_TAKEN", "Esse endereço já está em uso")
    }
    throw err
  }
}
