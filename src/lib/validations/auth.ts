import { z } from "@/lib/zod"

import { isValidBR } from "@/lib/phone"
import { isValidCNPJ, isValidCPF } from "@/lib/tax"
import { addressSchema } from "./address"
import { slugSchema } from "./establishment"

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(8, "Senha precisa de pelo menos 8 caracteres"),
})

const ORG_TYPES = ["EMPRESA", "AUTONOMO"] as const
export const orgTypeSchema = z.enum(ORG_TYPES)

const BUSINESS_CATEGORIES = [
  "BARBEARIA",
  "SALAO_BELEZA",
  "MANICURE_PEDICURE",
  "ESTETICA",
  "MASSAGEM_TERAPIA",
  "PERSONAL_TRAINER",
  "NUTRICIONISTA",
  "PSICOLOGO",
  "FISIOTERAPEUTA",
  "DENTISTA",
  "VETERINARIO",
  "COACH_CONSULTOR",
  "ADVOGADO",
  "CONTADOR",
  "FOTOGRAFO",
  "PROFESSOR_PARTICULAR",
  "MECANICA_AUTO",
  "LAVA_RAPIDO",
  "PET_SHOP",
  "CLINICA_SAUDE",
  "ESTUDIO_TATUAGEM",
  "OUTRO",
] as const

export const businessCategorySchema = z.enum(BUSINESS_CATEGORIES)

export const signUpSchema = z
  .object({
    type: orgTypeSchema,
    name: z.string().trim().min(2, "Nome muito curto").max(120, "Nome muito longo"),
    email: z.string().trim().toLowerCase().email("E-mail inválido"),
    password: z.string().min(8, "Senha precisa de pelo menos 8 caracteres").max(72),
    establishmentName: z
      .string()
      .trim()
      .min(2, "Nome muito curto")
      .max(120, "Nome muito longo"),
    slug: slugSchema,
    whatsapp: z.string().refine((v) => isValidBR(v), "WhatsApp inválido"),
    category: businessCategorySchema,
    taxId: z.string().min(1, "Obrigatório"),
  })
  .extend(addressSchema.shape)
  .superRefine((data, ctx) => {
    if (data.type === "EMPRESA") {
      if (!isValidCNPJ(data.taxId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["taxId"],
          message: "CNPJ inválido",
        })
      }
    } else {
      if (!isValidCPF(data.taxId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["taxId"],
          message: "CPF inválido",
        })
      }
    }
  })

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type OrgTypeInput = z.infer<typeof orgTypeSchema>
export type BusinessCategoryInput = z.infer<typeof businessCategorySchema>
