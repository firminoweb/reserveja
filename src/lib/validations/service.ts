import { z } from "@/lib/zod"

export const createServiceSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120, "Nome muito longo"),
  description: z.string().trim().max(500).optional(),
  durationMin: z.number().int().min(5, "Mínimo 5 minutos").max(8 * 60, "Máximo 8 horas"),
  priceCents: z.number().int().min(0, "Preço não pode ser negativo").max(99999_99, "Preço muito alto"),
  active: z.boolean().default(true),
  professionalIds: z.array(z.string()).optional(),
})

export const updateServiceSchema = createServiceSchema.partial()

export type CreateServiceInput = z.infer<typeof createServiceSchema>
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>
