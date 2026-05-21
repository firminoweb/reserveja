"use client"

import { useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { BookingStatus } from "@prisma/client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type Professional = { id: string; name: string }

type Props = {
  professionals: Professional[]
  selectedProfessionalId: string | null
  statuses: BookingStatus[]
  fromIso: string
  toIso: string
}

const STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: "COMPLETED", label: "Concluído" },
  { value: "CANCELLED", label: "Cancelado" },
  { value: "NO_SHOW", label: "Não compareceu" },
  { value: "CONFIRMED", label: "Confirmado" },
  { value: "PENDING", label: "Pendente" },
]

const PROFESSIONAL_ALL = "all"

export function HistoryFilters({
  professionals,
  selectedProfessionalId,
  statuses,
  fromIso,
  toIso,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()

  function buildHref(updates: Record<string, string | null>): string {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") next.delete(k)
      else next.set(k, v)
    }
    const q = next.toString()
    return q ? `${pathname}?${q}` : pathname
  }

  function navigate(href: string) {
    startTransition(() => {
      router.push(href, { scroll: false })
    })
  }

  function onFromChange(v: string) {
    navigate(buildHref({ from: v || null }))
  }
  function onToChange(v: string) {
    navigate(buildHref({ to: v || null }))
  }
  function onProfessionalChange(v: string) {
    navigate(buildHref({ professionalId: v === PROFESSIONAL_ALL ? null : v }))
  }
  function toggleStatus(status: BookingStatus) {
    const set = new Set(statuses)
    if (set.has(status)) set.delete(status)
    else set.add(status)
    const arr = Array.from(set)
    navigate(buildHref({ status: arr.length > 0 ? arr.join(",") : null }))
  }

  const fromInput = fromIso.slice(0, 10)
  const toInput = toIso.slice(0, 10)

  const showProfessional = professionals.length >= 2

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 space-y-4",
        pending && "opacity-70",
      )}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="hist-from">De</Label>
          <Input
            id="hist-from"
            type="date"
            value={fromInput}
            max={toInput}
            onChange={(e) => onFromChange(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hist-to">Até</Label>
          <Input
            id="hist-to"
            type="date"
            value={toInput}
            min={fromInput}
            onChange={(e) => onToChange(e.target.value)}
          />
        </div>
        {showProfessional ? (
          <div className="space-y-1.5">
            <Label>Profissional</Label>
            <Select
              value={selectedProfessionalId ?? PROFESSIONAL_ALL}
              onValueChange={onProfessionalChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PROFESSIONAL_ALL}>Todos</SelectItem>
                {professionals.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      <div>
        <Label className="mb-2 block">Status</Label>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => {
            const active = statuses.includes(s.value)
            return (
              <Button
                key={s.value}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                onClick={() => toggleStatus(s.value)}
                disabled={pending}
              >
                {s.label}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
