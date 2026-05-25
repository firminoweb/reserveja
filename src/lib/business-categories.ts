import type { BusinessCategory, OrgType } from "@prisma/client"

type CategoryOption = {
  value: BusinessCategory
  label: string
  orgType: "EMPRESA" | "AUTONOMO" | "AMBOS"
}

export const BUSINESS_CATEGORY_OPTIONS: CategoryOption[] = [
  { value: "BARBEARIA", label: "Barbearia", orgType: "EMPRESA" },
  { value: "SALAO_BELEZA", label: "Salão de beleza", orgType: "EMPRESA" },
  { value: "MANICURE_PEDICURE", label: "Manicure / Pedicure", orgType: "EMPRESA" },
  { value: "ESTETICA", label: "Estética", orgType: "EMPRESA" },
  { value: "MASSAGEM_TERAPIA", label: "Massagem / Terapia", orgType: "EMPRESA" },
  { value: "MECANICA_AUTO", label: "Mecânica auto", orgType: "EMPRESA" },
  { value: "LAVA_RAPIDO", label: "Lava-rápido", orgType: "EMPRESA" },
  { value: "PET_SHOP", label: "Pet shop", orgType: "EMPRESA" },
  { value: "CLINICA_SAUDE", label: "Clínica de saúde", orgType: "EMPRESA" },
  { value: "ESTUDIO_TATUAGEM", label: "Estúdio de tatuagem", orgType: "EMPRESA" },
  { value: "PERSONAL_TRAINER", label: "Personal trainer", orgType: "AUTONOMO" },
  { value: "NUTRICIONISTA", label: "Nutricionista", orgType: "AUTONOMO" },
  { value: "PSICOLOGO", label: "Psicólogo(a)", orgType: "AUTONOMO" },
  { value: "FISIOTERAPEUTA", label: "Fisioterapeuta", orgType: "AUTONOMO" },
  { value: "DENTISTA", label: "Dentista", orgType: "AUTONOMO" },
  { value: "VETERINARIO", label: "Veterinário(a)", orgType: "AUTONOMO" },
  { value: "COACH_CONSULTOR", label: "Coach / Consultor", orgType: "AUTONOMO" },
  { value: "ADVOGADO", label: "Advogado(a)", orgType: "AUTONOMO" },
  { value: "CONTADOR", label: "Contador(a)", orgType: "AUTONOMO" },
  { value: "FOTOGRAFO", label: "Fotógrafo(a)", orgType: "AUTONOMO" },
  { value: "PROFESSOR_PARTICULAR", label: "Professor particular", orgType: "AUTONOMO" },
  { value: "OUTRO", label: "Outro", orgType: "AMBOS" },
]

export function getCategoriesByType(type: OrgType) {
  return BUSINESS_CATEGORY_OPTIONS.filter(
    (o) => o.orgType === type || o.orgType === "AMBOS",
  )
}

export const BUSINESS_CATEGORY_LABEL: Record<BusinessCategory, string> =
  Object.fromEntries(BUSINESS_CATEGORY_OPTIONS.map((o) => [o.value, o.label])) as Record<
    BusinessCategory,
    string
  >
