import { createHash } from "node:crypto"

/**
 * Check de senha vazada via HaveIBeenPwned (k-anonymity).
 *
 * Privacidade: enviamos só os 5 primeiros hex do SHA-1, recebemos lista de
 * sufixos que casam, comparamos localmente. A senha completa nunca sai daqui.
 * Header `Add-Padding: true` mascara o número exato de matches.
 *
 * Fail-open: erro ou timeout (3s) → retorna false. Não bloqueia o usuário
 * se a API estiver fora — é checagem extra, não regra dura.
 */
export async function isPasswordLeaked(password: string): Promise<boolean> {
  if (!password) return false

  const sha1 = createHash("sha1").update(password).digest("hex").toUpperCase()
  const prefix = sha1.slice(0, 5)
  const suffix = sha1.slice(5)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 3000)

  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
      signal: controller.signal,
    })
    if (!res.ok) return false
    const body = await res.text()
    for (const line of body.split("\n")) {
      const [hashSuffix] = line.split(":")
      if (hashSuffix?.trim() === suffix) return true
    }
    return false
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}
