import { NextResponse, type NextRequest } from "next/server"

// Webhook da Evolution API (status de entrega WhatsApp).
// Por enquanto só loga — implementação real virá quando integrarmos com
// confirmação automática e lembrete 1h antes.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  console.log("[evolution-webhook]", body)
  return NextResponse.json({ ok: true })
}
