import { z } from "@/lib/zod"

import { isValidBR } from "@/lib/phone"

export const slugSchema = z
  .string()
  .trim()
  .min(3, "Mínimo 3 caracteres")
  .max(60, "Máximo 60 caracteres")
  .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífens")

export const createEstablishmentSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(2, "Nome muito curto").max(120),
  description: z.string().trim().max(500).optional(),
  whatsapp: z.string().min(10).max(20),
  timezone: z.string().default("America/Sao_Paulo"),
})

const optionalUrl = z
  .string()
  .trim()
  .max(2048)
  .url("URL inválida")
  .optional()
  .or(z.literal(""))

export const updateEstablishmentSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120, "Nome muito longo"),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  whatsapp: z
    .string()
    .refine((v) => isValidBR(v), "WhatsApp inválido"),
  timezone: z.string().min(3).max(60),
  logoUrl: optionalUrl,
  coverUrl: optionalUrl,
})

export const workingHourSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startMin: z.number().int().min(0).max(24 * 60),
  endMin: z.number().int().min(0).max(24 * 60),
}).refine((d) => d.endMin > d.startMin, "Fim deve ser depois do início")

export type CreateEstablishmentInput = z.infer<typeof createEstablishmentSchema>
export type UpdateEstablishmentInput = z.infer<typeof updateEstablishmentSchema>
export type WorkingHourInput = z.infer<typeof workingHourSchema>
