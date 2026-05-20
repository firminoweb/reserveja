"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Pencil, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ProfessionalFormDialog,
  type ProfessionalFormInitial,
} from "@/components/panel/professional-form-dialog"

type Professional = ProfessionalFormInitial

type ServiceOption = { id: string; name: string; active: boolean }

type Props = {
  professionals: Professional[]
  serviceOptions: ServiceOption[]
}

export function ProfessionalsList({ professionals, serviceOptions }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState<Professional | null>(null)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const serviceNameById = new Map(serviceOptions.map((s) => [s.id, s.name]))

  async function onDelete(p: Professional) {
    if (!confirm(`Excluir "${p.name}"?`)) return
    setDeletingId(p.id)
    const res = await fetch(`/api/professionals/${p.id}`, { method: "DELETE" })
    setDeletingId(null)
    if (res.status === 409) {
      toast.error("Profissional tem agendamentos. Desative em vez de excluir.")
      return
    }
    if (!res.ok) {
      toast.error("Não foi possível excluir.")
      return
    }
    toast.success("Profissional excluído")
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profissionais</h1>
          <p className="text-sm text-muted-foreground">
            {professionals.length} cadastrado(s)
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          Novo profissional
        </Button>
      </div>

      <ul className="mt-6 divide-y border rounded-lg">
        {professionals.length === 0 ? (
          <li className="p-6 text-center text-sm text-muted-foreground">
            Nenhum profissional. Clique em &ldquo;Novo profissional&rdquo; para começar.
          </li>
        ) : (
          professionals.map((p) => (
            <li
              key={p.id}
              className="px-5 py-3 flex items-center justify-between text-sm gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{p.name}</span>
                  {!p.active ? (
                    <Badge variant="secondary" className="text-xs">
                      Inativo
                    </Badge>
                  ) : null}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {p.serviceIds.length === 0
                    ? "Sem serviços associados"
                    : p.serviceIds
                        .map((id) => serviceNameById.get(id) ?? "?")
                        .join(" · ")}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Editar"
                  onClick={() => setEditing(p)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Excluir"
                  onClick={() => onDelete(p)}
                  disabled={deletingId === p.id}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))
        )}
      </ul>

      <ProfessionalFormDialog
        open={creating}
        onOpenChange={setCreating}
        serviceOptions={serviceOptions}
      />
      <ProfessionalFormDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        initial={editing ?? undefined}
        serviceOptions={serviceOptions}
      />
    </>
  )
}
