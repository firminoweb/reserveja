import { randomBytes } from "node:crypto"

// Sem "O0l1" pra evitar leitura ambígua quando o usuário precisa copiar
// uma senha temporária da tela ou de um SMS/WhatsApp.
const SAFE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"

export function generateTempPassword(length = 12): string {
  const bytes = randomBytes(length)
  let out = ""
  for (let i = 0; i < length; i++) {
    out += SAFE_ALPHABET[bytes[i] % SAFE_ALPHABET.length]
  }
  return out
}
