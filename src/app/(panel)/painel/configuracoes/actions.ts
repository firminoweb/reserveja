"use server"

import { revalidatePath } from "next/cache"

import { requireOwnerRole } from "@/server/auth/guards"
import { updateEstablishment } from "@/server/establishment/update"
import { updateOrganization } from "@/server/organization/update"
import {
  updateEstablishmentSchema,
  type UpdateEstablishmentInput,
} from "@/lib/validations/establishment"
import {
  updateOrganizationSchema,
  type UpdateOrganizationInput,
} from "@/lib/validations/organization"

type EstabResult =
  | { ok: true }
  | { ok: false; field?: keyof UpdateEstablishmentInput; message: string }

type OrgResult =
  | { ok: true }
  | { ok: false; field?: keyof UpdateOrganizationInput; message: string }

export async function updateEstablishmentAction(
  input: UpdateEstablishmentInput,
): Promise<EstabResult> {
  const { establishment } = await requireOwnerRole()

  const parsed = updateEstablishmentSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      ok: false,
      field: first?.path[0] as keyof UpdateEstablishmentInput | undefined,
      message: first?.message ?? "Dados inválidos",
    }
  }

  try {
    await updateEstablishment(establishment.id, parsed.data)
  } catch (err) {
    console.error("[configuracoes] updateEstablishment falhou", err)
    return { ok: false, message: "Não foi possível salvar." }
  }

  revalidatePath("/painel")
  revalidatePath("/painel/configuracoes")
  revalidatePath(`/${establishment.slug}`)
  return { ok: true }
}

export async function updateOrganizationAction(
  input: UpdateOrganizationInput,
): Promise<OrgResult> {
  const { organization } = await requireOwnerRole()

  const parsed = updateOrganizationSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      ok: false,
      field: first?.path[0] as keyof UpdateOrganizationInput | undefined,
      message: first?.message ?? "Dados inválidos",
    }
  }

  try {
    await updateOrganization(organization.id, parsed.data)
  } catch (err) {
    console.error("[configuracoes] updateOrganization falhou", err)
    return { ok: false, message: "Não foi possível salvar." }
  }

  revalidatePath("/painel/configuracoes")
  return { ok: true }
}
