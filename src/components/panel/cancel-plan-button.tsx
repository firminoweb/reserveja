"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cancelSubscriptionAction } from "@/app/(panel)/painel/plano/actions"

export function CancelPlanButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCancel() {
    if (!confirm("Tem certeza? Seu plano será rebaixado para o Grátis imediatamente.")) {
      return
    }

    setLoading(true)
    const res = await cancelSubscriptionAction()
    setLoading(false)

    if (!res.ok) {
      toast.error(res.message)
      return
    }

    toast.success("Plano cancelado. Você está no plano Grátis.")
    router.refresh()
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleCancel}
      disabled={loading}
    >
      {loading ? "Cancelando..." : "Cancelar plano"}
    </Button>
  )
}
