"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Pencil, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ServiceFormDialog,
  type ServiceFormInitial,
} from "@/components/panel/service-form-dialog"

type Service = ServiceFormInitial

type Props = {
  services: Service[]
}

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function ServicesList({ services }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState<Service | null>(null)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function onDelete(s: Service) {
    if (!confirm(`Excluir "${s.name}"?`)) return
    setDeletingId(s.id)
    const res = await fetch(`/api/services/${s.id}`, { method: "DELETE" })
    setDeletingId(null)
    if (res.status === 409) {
      toast.error("Serviço tem agendamentos. Desative em vez de excluir.")
      return
    }
    if (!res.ok) {
      toast.error("Não foi possível excluir.")
      return
    }
    toast.success("Serviço excluído")
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Serviços</h1>
          <p className="text-sm text-muted-foreground">
            {services.length} cadastrado(s)
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          Novo serviço
        </Button>
      </div>

      <ul className="mt-6 divide-y border rounded-lg">
        {services.length === 0 ? (
          <li className="p-6 text-center text-sm text-muted-foreground">
            Nenhum serviço cadastrado. Clique em &ldquo;Novo serviço&rdquo; para começar.
          </li>
        ) : (
          services.map((s) => (
            <li
              key={s.id}
              className="px-5 py-3 flex items-center justify-between text-sm gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{s.name}</span>
                  {!s.active ? (
                    <Badge variant="secondary" className="text-xs">
                      Inativo
                    </Badge>
                  ) : null}
                </div>
                <div className="text-xs text-muted-foreground">
                  {s.durationMin} min · {formatBRL(s.priceCents)}
                  {s.description ? ` · ${s.description}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Editar"
                  onClick={() => setEditing(s)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Excluir"
                  onClick={() => onDelete(s)}
                  disabled={deletingId === s.id}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))
        )}
      </ul>

      <ServiceFormDialog open={creating} onOpenChange={setCreating} />
      <ServiceFormDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        initial={editing ?? undefined}
      />
    </>
  )
}
