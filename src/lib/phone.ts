/**
 * Helpers de telefone brasileiro. Substituem libphonenumber-js, que está com
 * ESM quebrado na 1.13.2 (default-wrap bug na metadata). Os helpers cobrem
 * 100% dos casos do app — quando precisar de internacionalização, troque esse
 * arquivo sem mexer nos call sites.
 *
 * Regras BR:
 * - Fixo: 10 dígitos (DDD + 8). Não inicia com 9 após o DDD.
 * - Móvel: 11 dígitos (DDD + 9 + 8). Inicia com 9 após o DDD.
 * - Aceita entrada com país (+55) — 12 ou 13 dígitos.
 */

const RE_NON_DIGIT = /\D/g

export function digitsOnly(input: string): string {
  return input.replace(RE_NON_DIGIT, "")
}

/** Aplica máscara BR `(NN) NNNNN-NNNN` ou `(NN) NNNN-NNNN` enquanto digita. */
export function maskBR(input: string): string {
  const d = digitsOnly(input).slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** Valida se a string contém um telefone BR (fixo ou móvel) válido. */
export function isValidBR(input: string): boolean {
  let d = digitsOnly(input)
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) d = d.slice(2)
  if (d.length === 10) return d[2] !== "9"
  if (d.length === 11) return d[2] === "9"
  return false
}

/** Converte pra E.164 (`+55...`). Retorna null se inválido. */
export function toE164BR(input: string): string | null {
  let d = digitsOnly(input)
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) d = d.slice(2)
  if (d.length !== 10 && d.length !== 11) return null
  return `+55${d}`
}

/** Formata E.164 (ou qualquer entrada) em formato nacional BR. */
export function formatNationalBR(input: string): string {
  let d = digitsOnly(input)
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) d = d.slice(2)
  return maskBR(d)
}
