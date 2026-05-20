import { z } from "@/lib/zod"

const ROLES = ["OWNER", "STAFF"] as const

export const inviteMemberSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  role: z.enum(ROLES),
  unitIds: z.array(z.string()),
})

export const updateMembershipSchema = z.object({
  role: z.enum(ROLES),
  unitIds: z.array(z.string()),
})

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
export type UpdateMembershipInput = z.infer<typeof updateMembershipSchema>
