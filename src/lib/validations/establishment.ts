import { z } from "@/lib/zod"

import { isValidBR } from "@/lib/phone"
import { isValidCep } from "@/lib/viacep"

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

const optionalString = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""))

export const updateEstablishmentSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120, "Nome muito longo"),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  whatsapp: z
    .string()
    .refine((v) => isValidBR(v), "WhatsApp inválido"),
  timezone: z.string().min(3).max(60),
  logoUrl: optionalUrl,
  coverUrl: optionalUrl,
  // Endereço opcional em update (estabelecimentos pré-migration podem não ter)
  cep: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || isValidCep(v), "CEP inválido"),
  street: optionalString(120),
  streetNumber: optionalString(20),
  complement: optionalString(80),
  neighborhood: optionalString(80),
  city: optionalString(80),
  state: z
    .string()
    .trim()
    .toUpperCase()
    .max(2)
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^[A-Z]{2}$/.test(v), "UF deve ter 2 letras"),
})

export const workingHourSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startMin: z.number().int().min(0).max(24 * 60),
  endMin: z.number().int().min(0).max(24 * 60),
}).refine((d) => d.endMin > d.startMin, "Fim deve ser depois do início")

export type CreateEstablishmentInput = z.infer<typeof createEstablishmentSchema>
export type UpdateEstablishmentInput = z.infer<typeof updateEstablishmentSchema>
export type WorkingHourInput = z.infer<typeof workingHourSchema>
