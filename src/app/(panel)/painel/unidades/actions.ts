"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { db } from "@/lib/db"
import {
  requireOwnerMembership,
  requireOwnerRole,
  UNIT_COOKIE,
} from "@/server/auth/guards"
import {
  EstablishmentCreateError,
  createEstablishment,
} from "@/server/establishment/create"
import { toE164BR } from "@/lib/phone"
import {
  createUnitSchema,
  type CreateUnitInput,
} from "@/lib/validations/establishment-create"
import {
  updateUnitSchema,
  type UpdateUnitInput,
} from "@/lib/validations/establishment-update-by-id"

type CreateResult =
  | { ok: true; id: string }
  | { ok: false; field?: keyof CreateUnitInput; message: string }

type UpdateResult =
  | { ok: true }
  | { ok: false; field?: keyof UpdateUnitInput; message: string }

export async function setSelectedUnitAction(unitId: string): Promise<void> {
  const { establishments } = await requireOwnerMembership()
  const allowed = establishments.some((e) => e.id === unitId)
  if (!allowed) return

  const jar = await cookies()
  jar.set(UNIT_COOKIE, unitId, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  })
  revalidatePath("/painel", "layout")
}

export async function createUnitAction(
  input: CreateUnitInput,
): Promise<CreateResult> {
  const { organization } = await requireOwnerRole()

  const parsed = createUnitSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      ok: false,
      field: first?.path[0] as keyof CreateUnitInput | undefined,
      message: first?.message ?? "Dados inválidos",
    }
  }

  const whatsappE164 = toE164BR(parsed.data.whatsapp)!

  try {
    const created = await createEstablishment({
      organizationId: organization.id,
      slug: parsed.data.slug,
      name: parsed.data.name,
      whatsapp: whatsappE164,
    })
    revalidatePath("/painel/unidades")
    revalidatePath("/painel", "layout")
    return { ok: true, id: created.id }
  } catch (err) {
    if (err instanceof EstablishmentCreateError) {
      const fieldMap = {
        SLUG_TAKEN: "slug",
        PLAN_LIMIT: undefined,
        ORG_NOT_FOUND: undefined,
      } as const
      return {
        ok: false,
        field: fieldMap[err.code],
        message: err.message,
      }
    }
    console.error("[unidades] createEstablishment falhou", err)
    return { ok: false, message: "Não foi possível criar a unidade." }
  }
}

export async function updateUnitAction(
  unitId: string,
  input: UpdateUnitInput,
): Promise<UpdateResult> {
  const { establishments } = await requireOwnerRole()

  const target = establishments.find((e) => e.id === unitId)
  if (!target) {
    return { ok: false, message: "Sem acesso a essa unidade" }
  }

  const parsed = updateUnitSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      ok: false,
      field: first?.path[0] as keyof UpdateUnitInput | undefined,
      message: first?.message ?? "Dados inválidos",
    }
  }

  const whatsappE164 = toE164BR(parsed.data.whatsapp)!

  try {
    await db.establishment.update({
      where: { id: unitId },
      data: {
        name: parsed.data.name,
        description: parsed.data.description?.trim() || null,
        whatsapp: whatsappE164,
        timezone: parsed.data.timezone,
      },
    })
  } catch (err) {
    console.error("[unidades] updateUnit falhou", err)
    return { ok: false, message: "Não foi possível salvar." }
  }

  revalidatePath("/painel/unidades")
  revalidatePath("/painel/configuracoes")
  revalidatePath(`/${target.slug}`)
  revalidatePath("/painel", "layout")
  return { ok: true }
}

export async function switchAndRedirectToConfig(unitId: string) {
  await setSelectedUnitAction(unitId)
  redirect("/painel/configuracoes")
}
