"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const WEEKDAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
] as const

type DayState = { open: boolean; start: string; end: string }

function minutesToHHmm(m: number): string {
  const h = Math.floor(m / 60)
    .toString()
    .padStart(2, "0")
  const mm = (m % 60).toString().padStart(2, "0")
  return `${h}:${mm}`
}

function hhmmToMinutes(s: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(s)
  if (!m) return null
  const h = parseInt(m[1], 10)
  const min = parseInt(m[2], 10)
  if (h < 0 || h > 24 || min < 0 || min > 59) return null
  return h * 60 + min
}

type Props = {
  initial: Array<{ weekday: number; startMin: number; endMin: number }>
}

export function WorkingHoursForm({ initial }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const initialState: DayState[] = WEEKDAYS.map((w) => {
    const row = initial.find((h) => h.weekday === w.value)
    return row
      ? { open: true, start: minutesToHHmm(row.startMin), end: minutesToHHmm(row.endMin) }
      : { open: false, start: "09:00", end: "18:00" }
  })

  const [days, setDays] = useState<DayState[]>(initialState)

  function updateDay(idx: number, patch: Partial<DayState>) {
    setDays((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)))
  }

  async function onSave() {
    const hours: Array<{ weekday: number; startMin: number; endMin: number }> = []
    for (let i = 0; i < WEEKDAYS.length; i++) {
      const d = days[i]
      if (!d.open) continue
      const startMin = hhmmToMinutes(d.start)
      const endMin = hhmmToMinutes(d.end)
      if (startMin === null || endMin === null) {
        toast.error(`Horário inválido em ${WEEKDAYS[i].label}`)
        return
      }
      if (endMin <= startMin) {
        toast.error(`${WEEKDAYS[i].label}: fim deve ser depois do início`)
        return
      }
      hours.push({ weekday: WEEKDAYS[i].value, startMin, endMin })
    }

    setSaving(true)
    const res = await fetch("/api/working-hours", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hours }),
    })
    setSaving(false)

    if (!res.ok) {
      toast.error("Não foi possível salvar.")
      return
    }
    toast.success("Horários salvos")
    router.refresh()
  }

  return (
    <div className="mt-6 space-y-3 max-w-xl">
      {WEEKDAYS.map((w, i) => {
        const d = days[i]
        return (
          <div
            key={w.value}
            className="flex items-center gap-3 px-4 py-3 border rounded-md"
          >
            <label className="flex items-center gap-2 w-32 shrink-0">
              <input
                type="checkbox"
                className="size-4 rounded border-input"
                checked={d.open}
                onChange={(e) => updateDay(i, { open: e.target.checked })}
              />
              <span className="text-sm font-medium">{w.label}</span>
            </label>
            {d.open ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  type="time"
                  value={d.start}
                  onChange={(e) => updateDay(i, { start: e.target.value })}
                  className="w-32"
                />
                <span className="text-muted-foreground text-sm">até</span>
                <Input
                  type="time"
                  value={d.end}
                  onChange={(e) => updateDay(i, { end: e.target.value })}
                  className="w-32"
                />
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Fechado</span>
            )}
          </div>
        )
      })}

      <div className="pt-2">
        <Button onClick={onSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar horários"}
        </Button>
      </div>
    </div>
  )
}
