"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Building2, Check, Loader2, Pencil, Plus, X } from "lucide-react"

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
import { maskBR } from "@/lib/phone"
import { slugify } from "@/lib/slug"
import {
  createUnitSchema,
  type CreateUnitInput,
} from "@/lib/validations/establishment-create"
import {
  createUnitAction,
  setSelectedUnitAction,
} from "@/app/(panel)/painel/unidades/actions"
import {
  UnitEditDialog,
  type UnitEditInitial,
} from "@/components/panel/unit-edit-dialog"

type Unit = {
  id: string
  name: string
  slug: string
  description: string | null
  whatsapp: string
  timezone: string
}

type Props = {
  organizationName: string
  units: Unit[]
  currentUnitId: string
  planLimitUnits: number
  /** STAFF vê a lista e pode trocar de unidade, mas não cria/edita. */
  canManage: boolean
}

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid"

export function UnitsPanel({
  organizationName,
  units,
  currentUnitId,
  planLimitUnits,
  canManage,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<UnitEditInitial | null>(null)
  const [slugCheck, setSlugCheck] = useState<{ slug: string; available: boolean } | null>(null)

  const form = useForm<CreateUnitInput>({
    resolver: zodResolver(createUnitSchema),
    defaultValues: { name: "", slug: "", whatsapp: "" },
  })

  const name = useWatch({ control: form.control, name: "name" })
  const slug = useWatch({ control: form.control, name: "slug" })
  const [slugTouched, setSlugTouched] = useState(false)

  useEffect(() => {
    if (!slugTouched && name) {
      form.setValue("slug", slugify(name), { shouldValidate: false })
    }
  }, [name, slugTouched, form])

  const slugStatus = useMemo<SlugStatus>(() => {
    if (!slug) return "idle"
    if (slug.length < 3) return "invalid"
    if (slugCheck?.slug === slug) return slugCheck.available ? "available" : "taken"
    return "checking"
  }, [slug, slugCheck])

  useEffect(() => {
    if (!slug || slug.length < 3) return
    const ac = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/establishments/check-slug?slug=${encodeURIComponent(slug)}`,
          { signal: ac.signal },
        )
        const json = (await res.json()) as { available: boolean }
        setSlugCheck({ slug, available: json.available })
      } catch (err) {
        if ((err as Error).name !== "AbortError") setSlugCheck(null)
      }
    }, 350)
    return () => {
      ac.abort()
      clearTimeout(timer)
    }
  }, [slug])

  async function onSubmit(values: CreateUnitInput) {
    if (slugStatus === "taken") {
      form.setError("slug", { message: "Esse endereço já está em uso" })
      return
    }
    const res = await createUnitAction(values)
    if (!res.ok) {
      if (res.field) form.setError(res.field, { message: res.message })
      else toast.error(res.message)
      return
    }
    toast.success("Unidade criada")
    setOpen(false)
    form.reset({ name: "", slug: "", whatsapp: "" })
    setSlugTouched(false)
    router.refresh()
  }

  async function switchTo(unitId: string) {
    if (unitId === currentUnitId) return
    await setSelectedUnitAction(unitId)
    toast.success("Unidade trocada")
    router.refresh()
  }

  const reachedLimit = units.length >= planLimitUnits

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Unidades</h1>
          <p className="text-sm text-muted-foreground">
            {organizationName} · {units.length} de {planLimitUnits} no plano
          </p>
        </div>
        {canManage ? (
          <Button onClick={() => setOpen(true)} disabled={reachedLimit}>
            <Plus className="size-4" />
            Nova unidade
          </Button>
        ) : null}
      </div>

      {canManage && reachedLimit ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Limite do plano atingido. Pra adicionar mais unidades, atualize o plano.
        </p>
      ) : null}

      <ul className="mt-6 divide-y border rounded-lg">
        {units.map((u) => {
          const isCurrent = u.id === currentUnitId
          return (
            <li
              key={u.id}
              className="px-5 py-4 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Building2 className="size-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{u.name}</span>
                    {isCurrent ? (
                      <Badge variant="secondary" className="text-xs">
                        Atual
                      </Badge>
                    ) : null}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono truncate">
                    /{u.slug}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {canManage ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Editar"
                    onClick={() =>
                      setEditing({
                        id: u.id,
                        name: u.name,
                        description: u.description,
                        whatsapp: u.whatsapp,
                        timezone: u.timezone,
                      })
                    }
                  >
                    <Pencil className="size-4" />
                  </Button>
                ) : null}
                <Button
                  variant={isCurrent ? "secondary" : "outline"}
                  size="sm"
                  disabled={isCurrent}
                  onClick={() => switchTo(u.id)}
                >
                  {isCurrent ? "Selecionada" : "Selecionar"}
                </Button>
              </div>
            </li>
          )
        })}
      </ul>

      <UnitEditDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        unit={editing}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova unidade</DialogTitle>
            <DialogDescription>
              Cada unidade tem URL própria, serviços, profissionais e horários
              separados.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da unidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex.: Centro, Vila Madalena" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço público</FormLabel>
                    <FormControl>
                      <div className="flex items-stretch border rounded-md focus-within:ring-4 focus-within:ring-ring/40">
                        <span className="px-3 py-2 text-sm bg-muted text-muted-foreground rounded-l-md select-none">
                          reserveja.app/
                        </span>
                        <Input
                          {...field}
                          onChange={(e) => {
                            setSlugTouched(true)
                            field.onChange(slugify(e.target.value))
                          }}
                          className="border-0 rounded-none shadow-none focus-visible:ring-0"
                        />
                        <span className="px-3 flex items-center text-muted-foreground">
                          {slugStatus === "checking" ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : slugStatus === "available" ? (
                            <Check className="size-4 text-emerald-600" />
                          ) : slugStatus === "taken" ? (
                            <X className="size-4 text-destructive" />
                          ) : null}
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription>
                      {slugStatus === "taken" ? (
                        <span className="text-destructive">Já está em uso.</span>
                      ) : slugStatus === "available" ? (
                        <span className="text-emerald-600">Disponível.</span>
                      ) : (
                        "URL pública desta unidade."
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp da unidade</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(11) 98765-4321"
                        inputMode="tel"
                        {...field}
                        onChange={(e) => field.onChange(maskBR(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={form.formState.isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    form.formState.isSubmitting ||
                    slugStatus === "checking" ||
                    slugStatus === "taken"
                  }
                >
                  {form.formState.isSubmitting ? "Criando..." : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}
