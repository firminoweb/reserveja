"use client"

import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { Copy, KeyRound, LogIn, MoreHorizontal, Search, ShieldCheck, UserCog } from "lucide-react"
import type { Role } from "@prisma/client"

import {
  changeUserRoleAction,
  impersonateUserAction,
  resetUserPasswordAction,
} from "@/app/(admin)/admin/_actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

type AdminUser = {
  id: string
  name: string
  email: string
  role: Role
  membershipCount: number
  createdAtIso: string
  organizationName: string | null
}

type Props = {
  users: AdminUser[]
  currentUserId: string
  isImpersonating: boolean
}

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  OWNER: "Dono",
}

const ROLE_FILTER = [
  { value: "all", label: "Todos" },
  { value: "ADMIN", label: "Admin" },
  { value: "OWNER", label: "Donos" },
] as const

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
}

export function UsersPanel({ users, currentUserId, isImpersonating }: Props) {
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [tempPassword, setTempPassword] = useState<{
    name: string
    email: string
    password: string
  } | null>(null)
  const [pending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false
      if (!q) return true
      return (
        normalize(u.name).includes(q) || normalize(u.email).includes(q)
      )
    })
  }, [users, query, roleFilter])

  function dispatchRole(user: AdminUser, next: Role) {
    startTransition(async () => {
      const res = await changeUserRoleAction(user.id, next)
      if (res.ok) {
        toast.success(`${user.name} agora é ${ROLE_LABEL[next]}`)
      } else {
        toast.error(res.message)
      }
    })
  }

  function dispatchReset(user: AdminUser) {
    startTransition(async () => {
      const res = await resetUserPasswordAction(user.id)
      if (res.ok) {
        setTempPassword({
          name: user.name,
          email: user.email,
          password: res.data.tempPassword,
        })
        toast.success("Senha resetada — copie e envie pro usuário")
      } else {
        toast.error(res.message)
      }
    })
  }

  function dispatchImpersonate(user: AdminUser) {
    startTransition(async () => {
      // Server action redireciona em caso de sucesso (lança NEXT_REDIRECT).
      // Só cai aqui se retornou erro.
      const res = await impersonateUserAction(user.id)
      if (!res.ok) {
        toast.error(res.message)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Buscar por nome ou email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_FILTER.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          Nenhum usuário encontrado.
        </div>
      ) : (
        <>
          {/* Tabela desktop */}
          <div className="hidden md:block rounded-xl border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{u.organizationName ?? "—"}</div>
                      {u.membershipCount > 1 ? (
                        <div className="text-xs text-muted-foreground">
                          +{u.membershipCount - 1} outras
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                        {ROLE_LABEL[u.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <UserActionsMenu
                        user={u}
                        currentUserId={currentUserId}
                        isImpersonating={isImpersonating}
                        onChangeRole={dispatchRole}
                        onReset={dispatchReset}
                        onImpersonate={dispatchImpersonate}
                        pending={pending}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Cards mobile */}
          <div className="md:hidden space-y-2">
            {filtered.map((u) => (
              <div key={u.id} className="rounded-lg border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{u.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {u.email}
                    </div>
                  </div>
                  <UserActionsMenu
                    user={u}
                    currentUserId={currentUserId}
                    isImpersonating={isImpersonating}
                    onChangeRole={dispatchRole}
                    onReset={dispatchReset}
                    onImpersonate={dispatchImpersonate}
                    pending={pending}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground truncate">
                    {u.organizationName ?? "—"}
                  </span>
                  <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                    {ROLE_LABEL[u.role]}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog
        open={!!tempPassword}
        onOpenChange={(o) => !o && setTempPassword(null)}
      >
        <DialogContent>
          {tempPassword ? (
            <>
              <DialogHeader>
                <DialogTitle>Senha temporária gerada</DialogTitle>
                <DialogDescription>
                  Envie pra <span className="font-medium">{tempPassword.name}</span>
                  {" "}({tempPassword.email}) por um canal seguro. Esta tela é a
                  única vez que essa senha aparece.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-md border bg-muted px-4 py-3 font-mono text-lg text-center select-all">
                {tempPassword.password}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(tempPassword.password)
                    toast.success("Senha copiada")
                  }}
                >
                  <Copy className="size-4" />
                  Copiar
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

type MenuProps = {
  user: AdminUser
  currentUserId: string
  isImpersonating: boolean
  onChangeRole: (user: AdminUser, next: Role) => void
  onReset: (user: AdminUser) => void
  onImpersonate: (user: AdminUser) => void
  pending: boolean
}

function UserActionsMenu({
  user,
  currentUserId,
  isImpersonating,
  onChangeRole,
  onReset,
  onImpersonate,
  pending,
}: MenuProps) {
  const isSelf = user.id === currentUserId
  const canImpersonate = !isSelf && !isImpersonating
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={pending}
          aria-label="Ações"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs">Alterar role</DropdownMenuLabel>
        {(["ADMIN", "OWNER"] as Role[]).map((r) => (
          <DropdownMenuItem
            key={r}
            onClick={() => onChangeRole(user, r)}
            disabled={user.role === r || (isSelf && r !== "ADMIN")}
            className={cn(user.role === r && "font-semibold")}
          >
            {r === "ADMIN" ? (
              <ShieldCheck className="size-4" />
            ) : (
              <UserCog className="size-4" />
            )}
            {ROLE_LABEL[r]}
            {user.role === r ? " (atual)" : ""}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onReset(user)}>
          <KeyRound className="size-4" />
          Resetar senha
        </DropdownMenuItem>
        {canImpersonate ? (
          <DropdownMenuItem onClick={() => onImpersonate(user)}>
            <LogIn className="size-4" />
            Entrar como
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
