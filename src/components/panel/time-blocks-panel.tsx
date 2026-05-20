"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

type ProfessionalOption = { id: string; name: string }

type Block = {
  id: string
  startsAt: string // formatado pra UI (já passou por formatLocal no server)
  endsAt: string
  reason: string | null
  professional: { id: string; name: string } | null
}

type Props = {
  blocks: Block[]
  professionals: ProfessionalOption[]
}

export function TimeBlocksPanel({ blocks, professionals }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [startTime, setStartTime] = useState("12:00")
  const [endTime, setEndTime] = useState("13:00")
  const [professionalId, setProfessionalId] = useState<string>("")
  const [reason, setReason] = useState("")

  function resetForm() {
    setDate(today)
    setStartTime("12:00")
    setEndTime("13:00")
    setProfessionalId("")
    setReason("")
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch("/api/time-blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        startTime,
        endTime,
        professionalId: professionalId || undefined,
        reason: reason.trim() || undefined,
      }),
    })
    setSaving(false)

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      toast.error(json.message ?? "Não foi possível criar o bloqueio.")
      return
    }
    toast.success("Bloqueio criado")
    resetForm()
    setOpen(false)
    router.refresh()
  }

  async function onDelete(b: Block) {
    if (!confirm("Excluir bloqueio?")) return
    setDeletingId(b.id)
    const res = await fetch(`/api/time-blocks/${b.id}`, { method: "DELETE" })
    setDeletingId(null)
    if (!res.ok) {
      toast.error("Não foi possível excluir.")
      return
    }
    toast.success("Bloqueio excluído")
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bloqueios</h1>
          <p className="text-sm text-muted-foreground">
            Almoço, folga, feriado — impede agendamentos no período.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Novo bloqueio
        </Button>
      </div>

      <ul className="mt-6 divide-y border rounded-lg">
        {blocks.length === 0 ? (
          <li className="p-6 text-center text-sm text-muted-foreground">
            Nenhum bloqueio futuro.
          </li>
        ) : (
          blocks.map((b) => (
            <li
              key={b.id}
              className="px-5 py-3 flex items-center justify-between text-sm gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium">
                  {b.startsAt} — {b.endsAt}
                </div>
                <div className="text-xs text-muted-foreground">
                  {b.professional ? b.professional.name : "Todo o salão"}
                  {b.reason ? ` · ${b.reason}` : ""}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Excluir"
                onClick={() => onDelete(b)}
                disabled={deletingId === b.id}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))
        )}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo bloqueio</DialogTitle>
            <DialogDescription>
              Período em que o salão (ou um profissional) não atende.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onCreate} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="block-date">Data</Label>
              <Input
                id="block-date"
                type="date"
                value={date}
                min={today}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="block-start">Início</Label>
                <Input
                  id="block-start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="block-end">Fim</Label>
                <Input
                  id="block-end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="block-scope">Aplica a</Label>
              <select
                id="block-scope"
                value={professionalId}
                onChange={(e) => setProfessionalId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              >
                <option value="">Todo o salão</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="block-reason">Motivo (opcional)</Label>
              <Input
                id="block-reason"
                placeholder="Ex.: Almoço, feriado, folga"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={200}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Criando..." : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
