"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Copy, Pencil, Plus, Trash2, User as UserIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  inviteMemberSchema,
  updateMembershipSchema,
  type InviteMemberInput,
  type UpdateMembershipInput,
} from "@/lib/validations/team"
import {
  inviteMemberAction,
  removeMembershipAction,
  updateMembershipAction,
} from "@/app/(panel)/painel/equipe/actions"

type UnitOption = { id: string; name: string }

export type MemberRow = {
  membershipId: string
  userId: string
  name: string
  email: string
  role: "OWNER" | "STAFF"
  unitIds: string[]
  isSelf: boolean
}

type Props = {
  members: MemberRow[]
  units: UnitOption[]
  planLimitUsers: number
}

export function TeamPanel({ members, units, planLimitUsers }: Props) {
  const router = useRouter()
  const [openInvite, setOpenInvite] = useState(false)
  const [editing, setEditing] = useState<MemberRow | null>(null)
  const [tempCredentials, setTempCredentials] = useState<{
    email: string
    password: string
  } | null>(null)
  const [, startTransition] = useTransition()

  const inviteForm = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { name: "", email: "", role: "STAFF", unitIds: [] },
  })

  const editForm = useForm<UpdateMembershipInput>({
    resolver: zodResolver(updateMembershipSchema),
    defaultValues: { role: "STAFF", unitIds: [] },
  })

  function openEdit(m: MemberRow) {
    editForm.reset({ role: m.role, unitIds: m.unitIds })
    setEditing(m)
  }

  async function onInvite(values: InviteMemberInput) {
    const res = await inviteMemberAction(values)
    if (!res.ok) {
      if (res.field) inviteForm.setError(res.field, { message: res.message })
      else toast.error(res.message)
      return
    }
    setOpenInvite(false)
    inviteForm.reset({ name: "", email: "", role: "STAFF", unitIds: [] })
    if (res.result.tempPassword) {
      setTempCredentials({
        email: values.email.toLowerCase(),
        password: res.result.tempPassword,
      })
    } else {
      toast.success("Adicionado à equipe (usuário já existia)")
    }
    router.refresh()
  }

  async function onSaveEdit(values: UpdateMembershipInput) {
    if (!editing) return
    const res = await updateMembershipAction(editing.membershipId, values)
    if (!res.ok) {
      toast.error(res.message)
      return
    }
    toast.success("Membro atualizado")
    setEditing(null)
    router.refresh()
  }

  async function onRemove(m: MemberRow) {
    if (!confirm(`Remover ${m.name} da equipe?`)) return
    startTransition(async () => {
      const res = await removeMembershipAction(m.membershipId)
      if (!res.ok) {
        toast.error(res.message)
        return
      }
      toast.success("Membro removido")
      router.refresh()
    })
  }

  const reachedLimit = members.length >= planLimitUsers
  const unitNameById = new Map(units.map((u) => [u.id, u.name]))

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Equipe</h1>
          <p className="text-sm text-muted-foreground">
            {members.length} de {planLimitUsers} no plano
          </p>
        </div>
        <Button onClick={() => setOpenInvite(true)} disabled={reachedLimit}>
          <Plus className="size-4" />
          Convidar
        </Button>
      </div>

      {reachedLimit ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Limite do plano atingido. Pra adicionar mais membros, atualize o plano.
        </p>
      ) : null}

      <ul className="mt-6 divide-y border rounded-lg">
        {members.map((m) => (
          <li
            key={m.membershipId}
            className="px-5 py-4 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="size-9 rounded-full bg-muted grid place-items-center shrink-0">
                <UserIcon className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{m.name}</span>
                  <Badge
                    variant={m.role === "OWNER" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {m.role === "OWNER" ? "Dono" : "Staff"}
                  </Badge>
                  {m.isSelf ? (
                    <Badge variant="outline" className="text-xs">
                      Você
                    </Badge>
                  ) : null}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {m.email} ·{" "}
                  {m.unitIds.length === 0
                    ? "Todas as unidades"
                    : m.unitIds
                        .map((id) => unitNameById.get(id) ?? "?")
                        .join(", ")}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Editar"
                onClick={() => openEdit(m)}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Remover"
                disabled={m.isSelf}
                onClick={() => onRemove(m)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {/* Convidar */}
      <Dialog open={openInvite} onOpenChange={setOpenInvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar membro</DialogTitle>
            <DialogDescription>
              Se já existir conta com esse e-mail, ela vai entrar como membro
              da empresa. Se não, criamos uma conta com senha temporária.
            </DialogDescription>
          </DialogHeader>
          <Form {...inviteForm}>
            <form
              onSubmit={inviteForm.handleSubmit(onInvite)}
              className="space-y-4"
            >
              <FormField
                control={inviteForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={inviteForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={inviteForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-11 w-full rounded-md border border-input bg-transparent px-3.5 py-2 text-base shadow-xs focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/40 outline-none"
                      >
                        <option value="STAFF">Staff — atende clientes</option>
                        <option value="OWNER">Dono — gerencia tudo</option>
                      </select>
                    </FormControl>
                    <FormDescription>
                      Staff só vê agenda, serviços e bookings das unidades
                      autorizadas. Dono pode tudo.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={inviteForm.control}
                name="unitIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidades autorizadas</FormLabel>
                    <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                      {units.map((u) => {
                        const checked = field.value.includes(u.id)
                        return (
                          <label
                            key={u.id}
                            className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/40 text-sm"
                          >
                            <input
                              type="checkbox"
                              className="size-4 rounded border-input"
                              checked={checked}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.checked
                                    ? [...field.value, u.id]
                                    : field.value.filter((id) => id !== u.id),
                                )
                              }
                            />
                            <span>{u.name}</span>
                          </label>
                        )
                      })}
                    </div>
                    <FormDescription>
                      Deixe vazio = acesso a todas as unidades.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenInvite(false)}
                  disabled={inviteForm.formState.isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={inviteForm.formState.isSubmitting}
                >
                  {inviteForm.formState.isSubmitting ? "Convidando..." : "Convidar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Editar membership */}
      <Dialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar membro</DialogTitle>
            <DialogDescription>
              {editing ? `${editing.name} · ${editing.email}` : ""}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onSaveEdit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-11 w-full rounded-md border border-input bg-transparent px-3.5 py-2 text-base shadow-xs focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/40 outline-none"
                      >
                        <option value="STAFF">Staff</option>
                        <option value="OWNER">Dono</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="unitIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidades autorizadas</FormLabel>
                    <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                      {units.map((u) => {
                        const checked = field.value.includes(u.id)
                        return (
                          <label
                            key={u.id}
                            className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/40 text-sm"
                          >
                            <input
                              type="checkbox"
                              className="size-4 rounded border-input"
                              checked={checked}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.checked
                                    ? [...field.value, u.id]
                                    : field.value.filter((id) => id !== u.id),
                                )
                              }
                            />
                            <span>{u.name}</span>
                          </label>
                        )
                      })}
                    </div>
                    <FormDescription>
                      Deixe vazio = acesso a todas as unidades.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(null)}
                  disabled={editForm.formState.isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={editForm.formState.isSubmitting}>
                  {editForm.formState.isSubmitting ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Mostra credenciais temporárias após criar novo usuário */}
      <Dialog
        open={!!tempCredentials}
        onOpenChange={(o) => !o && setTempCredentials(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conta criada</DialogTitle>
            <DialogDescription>
              Compartilhe estas credenciais por um canal seguro (WhatsApp,
              presencialmente). Também enviamos por email se Resend estiver
              configurado.
            </DialogDescription>
          </DialogHeader>
          {tempCredentials ? (
            <div className="space-y-3">
              <div className="grid gap-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">E-mail</span>
                  <span className="font-mono">{tempCredentials.email}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Senha temporária</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{tempCredentials.password}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        navigator.clipboard.writeText(tempCredentials.password)
                        toast.success("Senha copiada")
                      }}
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Peça pro novo membro trocar a senha em &ldquo;Esqueci a senha&rdquo;
                no primeiro acesso.
              </p>
            </div>
          ) : null}
          <DialogFooter>
            <Button onClick={() => setTempCredentials(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
