import { z } from "@/lib/zod"

const scheduleInterval = z
  .object({
    weekday: z.number().int().min(0).max(6),
    startMin: z.number().int().min(0).max(24 * 60),
    endMin: z.number().int().min(0).max(24 * 60),
  })
  .refine((v) => v.endMin > v.startMin, "Fim deve ser depois do início")

// Só HTTPS (bloqueia data:/javascript:/http:). Ver nota em validations/establishment.ts.
const photoUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((u) => {
    if (!u) return true
    try {
      return new URL(u).protocol === "https:"
    } catch {
      return false
    }
  }, "Use uma URL https://")
  .optional()
  .or(z.literal(""))

export const createProfessionalSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120, "Nome muito longo"),
  photoUrl: photoUrlSchema,
  active: z.boolean().default(true),
  serviceIds: z.array(z.string()).optional(),
  // Quando schedules é undefined → segue horário do estabelecimento. Quando
  // é array (mesmo vazio) → substitui os schedules atuais (vazio = profissional
  // sem horário próprio = não atende).
  schedules: z.array(scheduleInterval).max(7 * 4).optional(),
})

export const updateProfessionalSchema = createProfessionalSchema.partial()

export type CreateProfessionalInput = z.infer<typeof createProfessionalSchema>
export type UpdateProfessionalInput = z.infer<typeof updateProfessionalSchema>
