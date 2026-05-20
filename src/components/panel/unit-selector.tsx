"use client"

import { useTransition } from "react"
import Link from "next/link"
import { ChevronsUpDown, Plus, Check, Building2 } from "lucide-react"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { setSelectedUnitAction } from "@/app/(panel)/painel/unidades/actions"

type Unit = { id: string; name: string; slug: string }

type Props = {
  organizationName: string
  current: Unit
  units: Unit[]
}

export function UnitSelector({ organizationName, current, units }: Props) {
  const [pending, startTransition] = useTransition()

  function select(unitId: string) {
    if (unitId === current.id) return
    startTransition(async () => {
      await setSelectedUnitAction(unitId)
      toast.success("Unidade trocada")
    })
  }

  const hasMultiple = units.length > 1

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="w-full text-left rounded-md px-3 py-2 hover:bg-muted/60 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60"
        disabled={pending}
      >
        <div className="flex items-center gap-2">
          <Building2 className="size-4 text-muted-foreground shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-xs text-muted-foreground truncate">
              {organizationName}
            </div>
            <div className="text-sm font-medium truncate">{current.name}</div>
          </div>
          {hasMultiple ? (
            <ChevronsUpDown className="size-4 text-muted-foreground shrink-0" />
          ) : null}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1.5">
          Unidades de {organizationName}
        </DropdownMenuLabel>
        {units.map((u) => (
          <DropdownMenuItem key={u.id} onSelect={() => select(u.id)}>
            <span className="flex-1 truncate">{u.name}</span>
            {u.id === current.id ? (
              <Check className="size-4 text-primary" />
            ) : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/painel/unidades">
            <Plus className="size-4" />
            Gerenciar unidades
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
