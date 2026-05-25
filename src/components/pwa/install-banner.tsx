"use client"

import { useEffect, useRef, useState } from "react"
import { Download, Share, X } from "lucide-react"

import { Button } from "@/components/ui/button"

const DISMISS_KEY = "rj_pwa_dismiss"
const DISMISS_DAYS = 30

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<{ outcome: "accepted" | "dismissed" }>
}

type BannerState = "hidden" | "native" | "ios"

function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

function isIOSSafari(): boolean {
  const ua = navigator.userAgent
  const isIOS = /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  return isIOS && !("BeforeInstallPromptEvent" in window)
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as never)["standalone"] === true)
  )
}

function wasDismissedRecently(): boolean {
  const ts = localStorage.getItem(DISMISS_KEY)
  return !!ts && Date.now() < Number(ts)
}

export function InstallBanner() {
  const [state, setState] = useState<BannerState>("hidden")
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    let cancelled = false
    let handler: ((e: Event) => void) | null = null

    void (async () => {
      await Promise.resolve()
      if (cancelled) return
      if (wasDismissedRecently() || isStandalone() || !isMobile()) return

      if (isIOSSafari()) {
        setState("ios")
        return
      }

      handler = (e: Event) => {
        e.preventDefault()
        deferredPrompt.current = e as BeforeInstallPromptEvent
        setState("native")
      }

      window.addEventListener("beforeinstallprompt", handler)

      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js").catch(() => {})
      }
    })()

    return () => {
      cancelled = true
      if (handler) window.removeEventListener("beforeinstallprompt", handler)
    }
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 86_400_000))
    setState("hidden")
  }

  async function install() {
    const prompt = deferredPrompt.current
    if (!prompt) return
    const { outcome } = await prompt.prompt()
    deferredPrompt.current = null
    if (outcome === "accepted") setState("hidden")
  }

  if (state === "hidden") return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 safe-bottom animate-in slide-in-from-bottom duration-300">
      <div className="mx-auto max-w-xl border-t bg-card px-4 py-4 shadow-lg">
        <button
          onClick={dismiss}
          aria-label="Fechar"
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        {state === "native" && (
          <div className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Download className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Instalar Reserve Já</p>
              <p className="text-xs text-muted-foreground">
                Acesse rápido pela tela inicial, sem ocupar espaço
              </p>
            </div>
            <Button onClick={install} size="sm" className="shrink-0">
              Instalar
            </Button>
          </div>
        )}

        {state === "ios" && (
          <div className="flex items-start gap-4 pr-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Share className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Adicione à tela inicial</p>
              <p className="text-xs text-muted-foreground">
                Toque em{" "}
                <Share className="inline size-3.5 align-text-bottom" />{" "}
                <span className="font-medium">Compartilhar</span> e depois em{" "}
                <span className="font-medium">&quot;Adicionar à Tela de Início&quot;</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
