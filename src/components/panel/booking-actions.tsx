"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Check, MoreHorizontal, UserX, XCircle } from "lucide-react"
import type { BookingStatus } from "@prisma/client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { setBookingStatusAction } from "@/app/(panel)/painel/_actions"

type Props = {
  bookingId: string
  status: BookingStatus
}

export function BookingActions({ bookingId, status }: Props) {
  const [pending, startTransition] = useTransition()

  function dispatch(next: BookingStatus, label: string) {
    startTransition(async () => {
      const res = await setBookingStatusAction(bookingId, next)
      if (res.ok) {
        toast.success(`Marcado como ${label}`)
      } else {
        toast.error(res.message)
      }
    })
  }

  if (status === "COMPLETED" || status === "CANCELLED") {
    return null
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        variant="outline"
        onClick={() => dispatch("COMPLETED", "concluído")}
        disabled={pending}
      >
        <Check className="size-4" />
        Concluir
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon-sm" variant="ghost" disabled={pending} aria-label="Mais">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => dispatch("NO_SHOW", "não compareceu")}>
            <UserX className="size-4" />
            Não compareceu
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => dispatch("CANCELLED", "cancelado")}
            variant="destructive"
          >
            <XCircle className="size-4" />
            Cancelar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
