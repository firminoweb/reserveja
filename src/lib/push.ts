// Wrapper do web-push (VAPID/Web Push Protocol).
// Stub-safe: se VAPID_PRIVATE_KEY não está setado, loga e retorna sem enviar.
// Subscription com endpoint 404/410 é deletada — Chrome/Firefox marcam assim
// quando o usuário desinstala o PWA, revoga permissão, ou a subscription expira.

import webpush from "web-push"

import { db } from "@/lib/db"

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const privateKey = process.env.VAPID_PRIVATE_KEY
const subject = process.env.VAPID_SUBJECT ?? "mailto:contato@reserveja.app"

let configured = false
function ensureConfigured(): boolean {
  if (configured) return true
  if (!publicKey || !privateKey) {
    console.warn("[push] VAPID keys não configuradas — push desabilitado")
    return false
  }
  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
  return true
}

export type PushPayload = {
  title: string
  body: string
  url: string
  tag?: string
}

export async function sendPushForBooking(
  bookingId: string,
  payload: PushPayload,
): Promise<{ sent: number; cleaned: number }> {
  if (!ensureConfigured()) return { sent: 0, cleaned: 0 }

  const subs = await db.pushSubscription.findMany({ where: { bookingId } })
  if (subs.length === 0) return { sent: 0, cleaned: 0 }

  let sent = 0
  let cleaned = 0
  const dead: string[] = []

  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
        )
        sent++
      } catch (err: unknown) {
        const code = (err as { statusCode?: number }).statusCode
        // 404 = endpoint sumiu; 410 = subscription revogada
        if (code === 404 || code === 410) {
          dead.push(s.endpoint)
        } else {
          console.warn("[push] erro inesperado ao enviar", { code, endpoint: s.endpoint })
        }
      }
    }),
  )

  if (dead.length > 0) {
    const result = await db.pushSubscription.deleteMany({
      where: { endpoint: { in: dead } },
    })
    cleaned = result.count
  }

  return { sent, cleaned }
}
