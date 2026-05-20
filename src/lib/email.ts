// Wrapper do Resend (email transacional).
// Stub-safe: se RESEND_API_KEY não está setado, loga e retorna ok:false.

import { Resend } from "resend"

const apiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL ?? "Reserve Já <onboarding@resend.dev>"

let client: Resend | null = null
function getClient(): Resend | null {
  if (!apiKey) return null
  if (!client) client = new Resend(apiKey)
  return client
}

type SendArgs = {
  to: string
  subject: string
  html: string
  text: string
}

export async function sendEmail({ to, subject, html, text }: SendArgs): Promise<{ ok: boolean }> {
  const c = getClient()
  if (!c) {
    console.warn("[email] RESEND_API_KEY não configurado — email ignorado", { to, subject })
    return { ok: false }
  }

  const { error } = await c.emails.send({ from: fromEmail, to, subject, html, text })
  if (error) {
    console.error("[email] Resend falhou", error)
    return { ok: false }
  }
  return { ok: true }
}
