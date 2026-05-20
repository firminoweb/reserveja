import { z } from "@/lib/zod"
import { isValidCep } from "@/lib/viacep"

const UF_REGEX = /^[A-Z]{2}$/

/**
 * Endereço estruturado (BR). Todos os campos são obrigatórios quando o
 * endereço é informado — usado em cadastro e configurações.
 *
 * No banco os campos são nullable pra compatibilidade com estabelecimentos
 * pré-migration; o form de configurações trata "endereço incompleto" como
 * estado válido (não exibe na vitrine, mas não bloqueia o save).
 */
export const addressSchema = z.object({
  cep: z.string().refine((v) => isValidCep(v), "CEP inválido"),
  street: z.string().trim().min(2, "Logradouro obrigatório").max(120),
  streetNumber: z.string().trim().min(1, "Número obrigatório").max(20),
  complement: z.string().trim().max(80).optional().or(z.literal("")),
  neighborhood: z.string().trim().min(2, "Bairro obrigatório").max(80),
  city: z.string().trim().min(2, "Cidade obrigatória").max(80),
  state: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => UF_REGEX.test(v), "UF deve ter 2 letras"),
})

export type AddressInput = z.infer<typeof addressSchema>
