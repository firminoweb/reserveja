import { z } from "@/lib/zod"

import { isValidBR } from "@/lib/phone"
import { isValidTaxId } from "@/lib/tax"
import { slugSchema } from "./establishment"

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(8, "Senha precisa de pelo menos 8 caracteres"),
})

const BUSINESS_CATEGORIES = [
  "BARBEARIA",
  "SALAO_BELEZA",
  "MANICURE_PEDICURE",
  "ESTETICA",
  "MASSAGEM_TERAPIA",
  "MECANICA_AUTO",
  "LAVA_RAPIDO",
  "PET_SHOP",
  "CLINICA_SAUDE",
  "ESTUDIO_TATUAGEM",
  "OUTRO",
] as const

export const businessCategorySchema = z.enum(BUSINESS_CATEGORIES)

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120, "Nome muito longo"),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(8, "Senha precisa de pelo menos 8 caracteres").max(72),
  establishmentName: z
    .string()
    .trim()
    .min(2, "Nome do estabelecimento muito curto")
    .max(120, "Nome muito longo"),
  slug: slugSchema,
  whatsapp: z.string().refine((v) => isValidBR(v), "WhatsApp inválido"),
  category: businessCategorySchema,
  // Opcional, mas se preenchido valida CPF (11) ou CNPJ (14)
  taxId: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || isValidTaxId(v), "CPF/CNPJ inválido"),
})

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type BusinessCategoryInput = z.infer<typeof businessCategorySchema>
