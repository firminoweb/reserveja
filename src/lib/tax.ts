/**
 * Helpers de CPF/CNPJ brasileiros. Validação de dígito verificador + máscara
 * progressiva. Aceita só BR — mesma estratégia de @/lib/phone.
 */

const RE_NON_DIGIT = /\D/g

function digits(s: string): string {
  return s.replace(RE_NON_DIGIT, "")
}

function isAllSame(s: string): boolean {
  return /^(\d)\1+$/.test(s)
}

/** Valida CPF (11 dígitos com checksum). */
export function isValidCPF(s: string): boolean {
  const d = digits(s)
  if (d.length !== 11 || isAllSame(d)) return false
  const calc = (limit: number) => {
    let sum = 0
    for (let i = 0; i < limit; i++) sum += parseInt(d[i], 10) * (limit + 1 - i)
    const r = (sum * 10) % 11
    return r === 10 ? 0 : r
  }
  return calc(9) === parseInt(d[9], 10) && calc(10) === parseInt(d[10], 10)
}

/** Valida CNPJ (14 dígitos com checksum). */
export function isValidCNPJ(s: string): boolean {
  const d = digits(s)
  if (d.length !== 14 || isAllSame(d)) return false
  const calc = (length: number) => {
    const weights =
      length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    let sum = 0
    for (let i = 0; i < length; i++) sum += parseInt(d[i], 10) * weights[i]
    const r = sum % 11
    return r < 2 ? 0 : 11 - r
  }
  return calc(12) === parseInt(d[12], 10) && calc(13) === parseInt(d[13], 10)
}

/** Valida que a string é CPF OU CNPJ. */
export function isValidTaxId(s: string): boolean {
  const d = digits(s)
  if (d.length === 11) return isValidCPF(d)
  if (d.length === 14) return isValidCNPJ(d)
  return false
}

/** Aplica máscara progressiva CPF/CNPJ baseado no comprimento. */
export function maskTaxId(s: string): string {
  const d = digits(s).slice(0, 14)
  if (d.length <= 11) {
    // CPF: 000.000.000-00
    if (d.length <= 3) return d
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
  }
  // CNPJ: 00.000.000/0000-00
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

/** Retorna apenas dígitos (pra persistir no DB). */
export function taxIdDigits(s: string): string {
  return digits(s)
}

export type TaxIdKind = "CPF" | "CNPJ"

export function kindOfTaxId(s: string): TaxIdKind | null {
  const d = digits(s)
  if (d.length === 11) return "CPF"
  if (d.length === 14) return "CNPJ"
  return null
}
