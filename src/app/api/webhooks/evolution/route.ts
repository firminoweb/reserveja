import { timingSafeEqual } from "node:crypto"

import { NextResponse, type NextRequest } from "next/server"

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

// Webhook da Evolution API (status de entrega WhatsApp).
//
// Aceita o segredo via header (preferido) ou query — algumas versões da Evolution
// só suportam ?token=... na URL configurada. Configure `EVOLUTION_WEBHOOK_SECRET`
// na Vercel e use a mesma string na URL do webhook na Evolution:
//   https://reserveja.vercel.app/api/webhooks/evolution?token=<secret>
//
// Se o segredo não estiver configurado em produção, recusamos por segurança.
export async function POST(req: NextRequest) {
  const expected = process.env.EVOLUTION_WEBHOOK_SECRET
  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "webhook_not_configured" }, { status: 503 })
    }
    // Em dev/preview sem segredo, aceita pra facilitar teste local.
  } else {
    const headerToken =
      req.headers.get("x-webhook-secret") ?? req.headers.get("x-evolution-secret")
    const queryToken = req.nextUrl.searchParams.get("token")
    const provided = headerToken ?? queryToken
    if (!provided || !safeEqual(provided, expected)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  // Log estruturado sem PII: só metadados do evento (sem corpo da mensagem,
  // sem números de telefone). Quando implementar lógica real, processar o body
  // mas continuar evitando logar conteúdo do cliente.
  console.log(
    "[evolution-webhook]",
    "event=", body?.event,
    "instance=", body?.instance,
    "at=", new Date().toISOString(),
  )
  return NextResponse.json({ ok: true })
}
