/**
 * Wrapper do ViaCEP (https://viacep.com.br). API pública e grátis, sem chave.
 * Aceita CEP com ou sem máscara, retorna null em erros/CEP inexistente.
 */

export type CepLookup = {
  street: string
  neighborhood: string
  city: string
  state: string
}

type ViaCepResponse = {
  cep?: string
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
  erro?: boolean | string
}

export function cepDigits(input: string): string {
  return input.replace(/\D/g, "").slice(0, 8)
}

export function isValidCep(input: string): boolean {
  return cepDigits(input).length === 8
}

export function maskCep(input: string): string {
  const digits = cepDigits(input)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export async function lookupCep(input: string): Promise<CepLookup | null> {
  const digits = cepDigits(input)
  if (digits.length !== 8) return null

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) return null
    const data = (await res.json()) as ViaCepResponse
    if (data.erro) return null
    return {
      street: data.logradouro ?? "",
      neighborhood: data.bairro ?? "",
      city: data.localidade ?? "",
      state: (data.uf ?? "").toUpperCase(),
    }
  } catch {
    return null
  }
}
