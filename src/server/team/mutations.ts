import { generateTempPassword } from "@/lib/temp-password"
import bcrypt from "bcryptjs"

import { db } from "@/lib/db"
import { sendEmail } from "@/lib/email"
import { emailButton, emailLayout, emailMuted } from "@/lib/email-template"
import type {
  InviteMemberInput,
  UpdateMembershipInput,
} from "@/lib/validations/team"

export class TeamError extends Error {
  constructor(
    public code:
      | "ALREADY_MEMBER"
      | "PLAN_LIMIT"
      | "LAST_OWNER"
      | "NOT_FOUND"
      | "SELF"
      | "INVALID_UNIT",
    message: string,
  ) {
    super(message)
  }
}

async function assertUnitsBelongToOrg(orgId: string, unitIds: string[]) {
  if (unitIds.length === 0) return
  const count = await db.establishment.count({
    where: { id: { in: unitIds }, organizationId: orgId },
  })
  if (count !== unitIds.length) {
    throw new TeamError("INVALID_UNIT", "Unidade inválida")
  }
}

export type InviteResult = {
  membershipId: string
  userCreated: boolean
  tempPassword?: string
}

export async function inviteMember(
  organizationId: string,
  input: InviteMemberInput,
): Promise<InviteResult> {
  await assertUnitsBelongToOrg(organizationId, input.unitIds)

  const org = await db.organization.findUnique({
    where: { id: organizationId },
    select: {
      planLimitUsers: true,
      _count: { select: { memberships: true } },
    },
  })
  if (!org) throw new TeamError("NOT_FOUND", "Empresa não encontrada")
  if (org._count.memberships >= org.planLimitUsers) {
    throw new TeamError(
      "PLAN_LIMIT",
      `Plano atual permite ${org.planLimitUsers} usuário(s)`,
    )
  }

  let user = await db.user.findUnique({
    where: { email: input.email },
    select: { id: true, name: true, email: true },
  })
  let tempPassword: string | undefined
  let userCreated = false

  if (user) {
    const existing = await db.membership.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId } },
      select: { id: true },
    })
    if (existing) {
      throw new TeamError("ALREADY_MEMBER", "Esse usuário já é membro da empresa")
    }
  } else {
    tempPassword = generateTempPassword()
    const passwordHash = await bcrypt.hash(tempPassword, 12)
    user = await db.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        role: "OWNER", // Role do sistema (User.role) — não confundir com Membership.role
        mustChangePassword: true, // forçar troca na primeira entrada
      },
      select: { id: true, name: true, email: true },
    })
    userCreated = true
  }

  const membership = await db.membership.create({
    data: {
      userId: user.id,
      organizationId,
      role: input.role,
      units:
        input.unitIds.length > 0
          ? { create: input.unitIds.map((establishmentId) => ({ establishmentId })) }
          : undefined,
    },
  })

  // Fire-and-forget: notifica o convidado por email se Resend estiver configurado.
  if (tempPassword) {
    void sendEmail({
      to: user.email,
      subject: "Você foi convidado pro Reserve Já",
      text: [
        `Olá ${user.name},`,
        ``,
        `Você foi convidado pra acessar uma empresa no Reserve Já.`,
        ``,
        `Seu login: ${user.email}`,
        `Senha temporária: ${tempPassword}`,
        ``,
        `Acesse pelo link abaixo e troque a senha em "Esqueci minha senha":`,
        `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login`,
      ].join("\n"),
      html: emailLayout([
        `<p>Olá <strong>${user.name.replace(/</g, "&lt;")}</strong>,</p>`,
        `<p>Você foi convidado pra acessar uma empresa no Reserve Já.</p>`,
        `<table style="margin:16px 0;font-size:14px"><tr><td style="padding:4px 12px 4px 0;color:#6b7280">Login</td><td><strong>${user.email}</strong></td></tr><tr><td style="padding:4px 12px 4px 0;color:#6b7280">Senha temporária</td><td><code style="background:#f4f4f5;padding:2px 6px;border-radius:4px">${tempPassword}</code></td></tr></table>`,
        `<p style="text-align:center;margin:24px 0">${emailButton(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login`, "Acessar o painel")}</p>`,
        emailMuted('Troque a senha no primeiro acesso pelo fluxo "Esqueci minha senha".'),
      ].join("")),
    })
  }

  return { membershipId: membership.id, userCreated, tempPassword }
}

export async function updateMembership(
  organizationId: string,
  membershipId: string,
  currentUserId: string,
  input: UpdateMembershipInput,
) {
  await assertUnitsBelongToOrg(organizationId, input.unitIds)

  const membership = await db.membership.findFirst({
    where: { id: membershipId, organizationId },
    select: { id: true, userId: true, role: true },
  })
  if (!membership) throw new TeamError("NOT_FOUND", "Membership não encontrada")

  if (membership.userId === currentUserId && membership.role === "OWNER" && input.role !== "OWNER") {
    // Se for o último OWNER, não pode rebaixar a si próprio
    const otherOwners = await db.membership.count({
      where: { organizationId, role: "OWNER", id: { not: membershipId } },
    })
    if (otherOwners === 0) {
      throw new TeamError(
        "LAST_OWNER",
        "Você é o único dono. Promova outro antes de rebaixar.",
      )
    }
  }

  return db.$transaction(async (tx) => {
    await tx.membershipUnit.deleteMany({ where: { membershipId } })
    if (input.unitIds.length > 0) {
      await tx.membershipUnit.createMany({
        data: input.unitIds.map((establishmentId) => ({
          membershipId,
          establishmentId,
        })),
      })
    }
    return tx.membership.update({
      where: { id: membershipId },
      data: { role: input.role },
    })
  })
}

export async function removeMembership(
  organizationId: string,
  membershipId: string,
  currentUserId: string,
) {
  const membership = await db.membership.findFirst({
    where: { id: membershipId, organizationId },
    select: { id: true, userId: true, role: true },
  })
  if (!membership) throw new TeamError("NOT_FOUND", "Membership não encontrada")

  if (membership.userId === currentUserId) {
    throw new TeamError("SELF", "Você não pode remover a si mesmo")
  }

  if (membership.role === "OWNER") {
    const otherOwners = await db.membership.count({
      where: { organizationId, role: "OWNER", id: { not: membershipId } },
    })
    if (otherOwners === 0) {
      throw new TeamError("LAST_OWNER", "Não dá pra remover o último dono")
    }
  }

  await db.membership.delete({ where: { id: membershipId } })
}
