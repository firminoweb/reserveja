"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

type State = "checking" | "unsupported" | "denied" | "idle" | "subscribing" | "subscribed"

// Web Push usa BufferSource pra applicationServerKey. Browsers entregam a chave
// em base64url; precisa converter pra bytes brutos sobre um ArrayBuffer "puro"
// (não SharedArrayBuffer) — TS estrito não aceita o tipo genérico.
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(b64)
  const buffer = new ArrayBuffer(raw.length)
  const out = new Uint8Array(buffer)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export function PushOptIn({ bookingToken }: { bookingToken: string }) {
  const [state, setState] = useState<State>("checking")

  useEffect(() => {
    let cancelled = false

    // Tudo dentro do async + await garante que cada setState é "async result"
    // (regra react-hooks/set-state-in-effect — ver CLAUDE.md).
    void (async () => {
      await Promise.resolve()
      if (cancelled) return

      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        setState("unsupported")
        return
      }
      if (Notification.permission === "denied") {
        setState("denied")
        return
      }

      try {
        const reg = await navigator.serviceWorker.getRegistration("/sw.js")
        const existing = await reg?.pushManager.getSubscription()
        if (cancelled) return
        setState(existing ? "subscribed" : "idle")
      } catch {
        if (cancelled) return
        setState("idle")
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  async function subscribe() {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) {
      toast.error("Notificações não configuradas no servidor")
      return
    }

    setState("subscribing")
    try {
      const reg = await navigator.serviceWorker.register("/sw.js")
      await navigator.serviceWorker.ready

      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        })
      }

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingToken, subscription: sub.toJSON() }),
      })
      if (!res.ok) throw new Error("subscribe failed")

      setState("subscribed")
      toast.success("Lembrete ativado neste navegador")
    } catch (err) {
      console.error("[push] subscribe falhou", err)
      // Notification.permission pode ter virado "denied" durante o prompt
      if (typeof Notification !== "undefined" && Notification.permission === "denied") {
        setState("denied")
      } else {
        setState("idle")
      }
      toast.error("Não foi possível ativar o lembrete")
    }
  }

  if (state === "checking" || state === "unsupported") return null

  if (state === "denied") {
    return (
      <p className="text-xs text-muted-foreground">
        Notificações bloqueadas — habilite nas configurações do navegador.
      </p>
    )
  }

  if (state === "subscribed") {
    return (
      <p className="text-xs text-emerald-700">
        ✓ Você receberá um lembrete neste navegador antes do horário
      </p>
    )
  }

  return (
    <Button
      onClick={subscribe}
      variant="outline"
      className="w-full"
      size="lg"
      disabled={state === "subscribing"}
    >
      {state === "subscribing" ? "Ativando..." : "Receber lembrete neste navegador"}
    </Button>
  )
}
