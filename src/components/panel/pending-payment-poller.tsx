"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type Props = {
  pendingPlan: string
}

export function PendingPaymentPoller({ pendingPlan }: Props) {
  const router = useRouter()
  const activatedRef = useRef(false)

  useEffect(() => {
    if (activatedRef.current) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/billing/status", { cache: "no-store" })
        if (!res.ok) return
        const data = (await res.json()) as {
          plan: string
          pendingPlan: string | null
        }

        if (!data.pendingPlan && data.plan !== "FREE") {
          activatedRef.current = true
          clearInterval(interval)
          toast.success(`Plano ${data.plan} ativado com sucesso!`, {
            duration: 6000,
          })
          router.refresh()
        }
      } catch {
        // silencioso — tenta de novo no próximo tick
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [pendingPlan, router])

  return null
}
