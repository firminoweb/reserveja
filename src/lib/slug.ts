/**
 * Transforma um nome em slug URL-safe: minúsculas, sem acento, hífen entre
 * palavras. Limita a 60 caracteres.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}
