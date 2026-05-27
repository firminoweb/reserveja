"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cancelSubscriptionAction } from "@/app/(panel)/painel/plano/actions"

export function CancelPlanButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCancel() {
    setLoading(true)
    const res = await cancelSubscriptionAction()
    setLoading(false)

    if (!res.ok) {
      toast.error(res.message)
      setOpen(false)
      return
    }

    const expires = new Date(res.expiresAt)
    const isImmediate = expires <= new Date()

    if (isImmediate) {
      toast.success("Plano cancelado. Você está no plano Grátis.")
    } else {
      toast.success(
        `Plano cancelado. Você ainda pode usar até ${expires.toLocaleDateString("pt-BR")}.`,
      )
    }

    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Cancelar plano
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar plano</DialogTitle>
          <DialogDescription>
            A cobrança recorrente será cancelada. Você poderá continuar
            usando o plano atual até o fim do período já pago. Após isso,
            será rebaixado para o plano Grátis automaticamente.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Voltar
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={loading}>
            {loading ? "Cancelando..." : "Confirmar cancelamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
