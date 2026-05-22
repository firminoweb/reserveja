// Wrapper do Resend (email transacional).
// Stub-safe: se RESEND_API_KEY não está setado, loga e retorna ok:false.

import { Resend } from "resend"

const apiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL ?? "Reserve Já <onboarding@resend.dev>"

// Extrai só o endereço de "Nome <email@dom>" ou retorna o input se já for puro.
// Usado em headers/campos que exigem só o endereço (ex.: ORGANIZER do .ics).
export function getFromAddress(): string {
  const match = fromEmail.match(/<([^>]+)>/)
  return match ? match[1] : fromEmail.trim()
}

let client: Resend | null = null
function getClient(): Resend | null {
  if (!apiKey) return null
  if (!client) client = new Resend(apiKey)
  return client
}

export type EmailAttachment = {
  filename: string
  content: string | Buffer
  contentType?: string
}

type SendArgs = {
  to: string
  subject: string
  html: string
  text: string
  attachments?: EmailAttachment[]
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  attachments,
}: SendArgs): Promise<{ ok: boolean }> {
  const c = getClient()
  if (!c) {
    console.warn("[email] RESEND_API_KEY não configurado — email ignorado", { to, subject })
    return { ok: false }
  }

  const { error } = await c.emails.send({
    from: fromEmail,
    to,
    subject,
    html,
    text,
    attachments: attachments?.map((a) => ({
      filename: a.filename,
      // Resend aceita Buffer ou string base64. Padronizamos em base64 string.
      content:
        typeof a.content === "string"
          ? Buffer.from(a.content, "utf-8").toString("base64")
          : a.content.toString("base64"),
      contentType: a.contentType,
    })),
  })
  if (error) {
    console.error("[email] Resend falhou", error)
    return { ok: false }
  }
  return { ok: true }
}
