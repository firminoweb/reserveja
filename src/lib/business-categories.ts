// Labels e ordem dos enums de BusinessCategory pra exibição na UI.
// Mantém em sincronia com o enum em prisma/schema.prisma e validations/auth.ts.

import type { BusinessCategory } from "@prisma/client"

export const BUSINESS_CATEGORY_OPTIONS: Array<{
  value: BusinessCategory
  label: string
}> = [
  { value: "BARBEARIA", label: "Barbearia" },
  { value: "SALAO_BELEZA", label: "Salão de beleza" },
  { value: "MANICURE_PEDICURE", label: "Manicure / Pedicure" },
  { value: "ESTETICA", label: "Estética" },
  { value: "MASSAGEM_TERAPIA", label: "Massagem / Terapia" },
  { value: "MECANICA_AUTO", label: "Mecânica auto" },
  { value: "LAVA_RAPIDO", label: "Lava-rápido" },
  { value: "PET_SHOP", label: "Pet shop" },
  { value: "CLINICA_SAUDE", label: "Clínica de saúde" },
  { value: "ESTUDIO_TATUAGEM", label: "Estúdio de tatuagem" },
  { value: "OUTRO", label: "Outro" },
]

export const BUSINESS_CATEGORY_LABEL: Record<BusinessCategory, string> =
  Object.fromEntries(BUSINESS_CATEGORY_OPTIONS.map((o) => [o.value, o.label])) as Record<
    BusinessCategory,
    string
  >
