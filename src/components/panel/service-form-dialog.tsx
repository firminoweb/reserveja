"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { z } from "@/lib/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MoneyInput } from "@/components/ui/money-input"
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const formSchema = z.object({
  name: z.string().min(2, "Nome muito curto").max(120),
  description: z.string().max(500).optional(),
  durationMin: z
    .number({ message: "Informe a duração" })
    .int()
    .min(5, "Mínimo 5 minutos")
    .max(8 * 60, "Máximo 8 horas"),
  priceCents: z
    .number({ message: "Informe o preço" })
    .int()
    .min(0, "Não pode ser negativo")
    .max(99999_99, "Valor muito alto"),
  active: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

export type ServiceFormInitial = {
  id: string
  name: string
  description: string | null
  durationMin: number
  priceCents: number
  active: boolean
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: ServiceFormInitial
}

const DEFAULTS: FormValues = {
  name: "",
  description: "",
  durationMin: 30,
  priceCents: 0,
  active: true,
}

export function ServiceFormDialog({ open, onOpenChange, initial }: Props) {
  const router = useRouter()
  const isEdit = !!initial

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULTS,
  })

  useEffect(() => {
    if (open) {
      form.reset(
        initial
          ? {
              name: initial.name,
              description: initial.description ?? "",
              durationMin: initial.durationMin,
              priceCents: initial.priceCents,
              active: initial.active,
            }
          : DEFAULTS,
      )
    }
  }, [open, initial, form])

  async function onSubmit(values: FormValues) {
    const payload = {
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
      durationMin: values.durationMin,
      priceCents: values.priceCents,
      active: values.active,
    }

    const res = await fetch(
      isEdit ? `/api/services/${initial!.id}` : "/api/services",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    )

    if (!res.ok) {
      toast.error("Não foi possível salvar o serviço.")
      return
    }

    toast.success(isEdit ? "Serviço atualizado" : "Serviço criado")
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar serviço" : "Novo serviço"}</DialogTitle>
          <DialogDescription>
            Nome, duração e preço aparecem pro cliente na hora de agendar.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Corte masculino" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Detalhes que o cliente verá" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="durationMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={5}
                        step={5}
                        value={Number.isFinite(field.value) ? field.value : ""}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priceCents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço</FormLabel>
                    <FormControl>
                      <MoneyInput value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      className="size-4 rounded border-input"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Ativo (aparece pro cliente)</FormLabel>
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
