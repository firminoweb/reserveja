import { z } from "@/lib/zod"

import { isValidBR } from "@/lib/phone"

export const updateUnitSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  whatsapp: z.string().refine((v) => isValidBR(v), "WhatsApp inválido"),
  timezone: z.string().min(3).max(60),
})

export type UpdateUnitInput = z.infer<typeof updateUnitSchema>
