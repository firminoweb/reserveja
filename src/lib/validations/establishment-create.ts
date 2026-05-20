import { z } from "@/lib/zod"

import { isValidBR } from "@/lib/phone"
import { slugSchema } from "./establishment"

export const createUnitSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120),
  slug: slugSchema,
  whatsapp: z.string().refine((v) => isValidBR(v), "WhatsApp inválido"),
})

export type CreateUnitInput = z.infer<typeof createUnitSchema>
