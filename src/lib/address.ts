export type AddressLike = {
  street: string | null
  streetNumber: string | null
  complement?: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  cep?: string | null
}

export function hasAddress(a: AddressLike): boolean {
  return Boolean(a.street && a.city)
}

/** "Rua Foo, 123 — Bairro — Cidade/UF" */
export function formatAddressOneLine(a: AddressLike): string {
  if (!hasAddress(a)) return ""
  const parts = [
    `${a.street}, ${a.streetNumber ?? "s/n"}`,
    a.neighborhood,
    a.city && a.state ? `${a.city}/${a.state}` : a.city,
  ].filter(Boolean)
  return parts.join(" — ")
}

/** Linhas para exibição (vitrine pública) */
export function formatAddressLines(a: AddressLike): string[] {
  if (!hasAddress(a)) return []
  const line1 = [a.street, a.streetNumber ?? "s/n"].filter(Boolean).join(", ")
  const compl = a.complement?.trim()
  const line2 = [a.neighborhood, a.city && a.state ? `${a.city}/${a.state}` : a.city]
    .filter(Boolean)
    .join(" — ")
  return [line1, compl ?? "", line2].filter(Boolean)
}

/** URL do Google Maps com query do endereço */
export function googleMapsUrl(a: AddressLike): string | null {
  if (!hasAddress(a)) return null
  const query = encodeURIComponent(formatAddressOneLine(a))
  return `https://www.google.com/maps/search/?api=1&query=${query}`
}

/** "00000-000" a partir dos 8 dígitos */
export function maskCepDisplay(cep: string | null): string {
  if (!cep || cep.length !== 8) return cep ?? ""
  return `${cep.slice(0, 5)}-${cep.slice(5)}`
}
