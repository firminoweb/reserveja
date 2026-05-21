"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import type { OrgStatus } from "@prisma/client"

import { setOrganizationStatusAction } from "@/app/(admin)/admin/_actions"
import { Button } from "@/components/ui/button"

type Props = {
  organizationId: string
  status: OrgStatus
}

const STATUS_LABEL: Record<OrgStatus, string> = {
  ACTIVE: "Ativa",
  TRIAL: "Trial",
  SUSPENDED: "Suspensa",
}

export function OrgStatusActions({ organizationId, status }: Props) {
  const [pending, startTransition] = useTransition()

  function dispatch(next: OrgStatus) {
    if (next === status) return
    startTransition(async () => {
      const res = await setOrganizationStatusAction(organizationId, next)
      if (res.ok) {
        toast.success(`Status alterado para ${STATUS_LABEL[next]}`)
      } else {
        toast.error(res.message)
      }
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "ACTIVE" ? (
        <Button
          size="sm"
          onClick={() => dispatch("ACTIVE")}
          disabled={pending}
        >
          Ativar
        </Button>
      ) : null}
      {status !== "SUSPENDED" ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => dispatch("SUSPENDED")}
          disabled={pending}
          className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
        >
          Suspender
        </Button>
      ) : null}
      {status !== "TRIAL" ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => dispatch("TRIAL")}
          disabled={pending}
        >
          Mover pra Trial
        </Button>
      ) : null}
    </div>
  )
}
