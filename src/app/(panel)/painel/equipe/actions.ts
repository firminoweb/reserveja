"use server"

import { revalidatePath } from "next/cache"

import { requireOwnerRole } from "@/server/auth/guards"
import {
  TeamError,
  inviteMember,
  removeMembership,
  updateMembership,
  type InviteResult,
} from "@/server/team/mutations"
import {
  inviteMemberSchema,
  updateMembershipSchema,
  type InviteMemberInput,
  type UpdateMembershipInput,
} from "@/lib/validations/team"

type InviteActionResult =
  | { ok: true; result: InviteResult }
  | { ok: false; field?: keyof InviteMemberInput; message: string }

type UpdateActionResult =
  | { ok: true }
  | { ok: false; field?: keyof UpdateMembershipInput; message: string }

type RemoveActionResult = { ok: true } | { ok: false; message: string }

export async function inviteMemberAction(
  input: InviteMemberInput,
): Promise<InviteActionResult> {
  const { organization } = await requireOwnerRole()

  const parsed = inviteMemberSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      ok: false,
      field: first?.path[0] as keyof InviteMemberInput | undefined,
      message: first?.message ?? "Dados inválidos",
    }
  }

  try {
    const result = await inviteMember(organization.id, parsed.data)
    revalidatePath("/painel/equipe")
    return { ok: true, result }
  } catch (err) {
    if (err instanceof TeamError) {
      const fieldMap: Partial<Record<TeamError["code"], keyof InviteMemberInput>> = {
        ALREADY_MEMBER: "email",
        INVALID_UNIT: "unitIds",
      }
      return {
        ok: false,
        field: fieldMap[err.code],
        message: err.message,
      }
    }
    console.error("[equipe] inviteMember falhou", err)
    return { ok: false, message: "Não foi possível convidar." }
  }
}

export async function updateMembershipAction(
  membershipId: string,
  input: UpdateMembershipInput,
): Promise<UpdateActionResult> {
  const { organization, session } = await requireOwnerRole()

  const parsed = updateMembershipSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      ok: false,
      field: first?.path[0] as keyof UpdateMembershipInput | undefined,
      message: first?.message ?? "Dados inválidos",
    }
  }

  try {
    await updateMembership(
      organization.id,
      membershipId,
      session.user.id,
      parsed.data,
    )
    revalidatePath("/painel/equipe")
    return { ok: true }
  } catch (err) {
    if (err instanceof TeamError) {
      return { ok: false, message: err.message }
    }
    console.error("[equipe] updateMembership falhou", err)
    return { ok: false, message: "Não foi possível salvar." }
  }
}

export async function removeMembershipAction(
  membershipId: string,
): Promise<RemoveActionResult> {
  const { organization, session } = await requireOwnerRole()
  try {
    await removeMembership(organization.id, membershipId, session.user.id)
    revalidatePath("/painel/equipe")
    return { ok: true }
  } catch (err) {
    if (err instanceof TeamError) {
      return { ok: false, message: err.message }
    }
    console.error("[equipe] removeMembership falhou", err)
    return { ok: false, message: "Não foi possível remover." }
  }
}
