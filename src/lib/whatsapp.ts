// Wrapper da Evolution API (WhatsApp).
// Stub: as funções logam no console em dev e fazem POST se as envs estiverem configuradas.

const baseUrl = process.env.EVOLUTION_API_URL
const apiKey = process.env.EVOLUTION_API_KEY
const instance = process.env.EVOLUTION_INSTANCE ?? "default"

type SendTextArgs = {
  phone: string // E.164: +5511999999999
  message: string
}

export async function sendText({ phone, message }: SendTextArgs): Promise<{ ok: boolean }> {
  if (!baseUrl || !apiKey) {
    console.warn("[whatsapp] EVOLUTION_API_URL/KEY não configurados — mensagem ignorada", { phone, message })
    return { ok: false }
  }

  const res = await fetch(`${baseUrl}/message/sendText/${instance}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
    },
    body: JSON.stringify({
      number: phone.replace(/\D/g, ""),
      text: message,
    }),
  })

  if (!res.ok) {
    console.error("[whatsapp] envio falhou", res.status, await res.text())
    return { ok: false }
  }

  return { ok: true }
}
