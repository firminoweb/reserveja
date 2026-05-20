import { z } from "@/lib/zod"

import { isValidTaxId } from "@/lib/tax"
import { businessCategorySchema } from "./auth"

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120, "Nome muito longo"),
  category: businessCategorySchema,
  taxId: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || isValidTaxId(v), "CPF/CNPJ inválido"),
})

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>
