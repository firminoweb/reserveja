"use client"

import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { z } from "@/lib/zod"
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

const WEEKDAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
] as const

type ScheduleEntry = { open: boolean; start: string; end: string }

const formSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(120),
  active: z.boolean(),
  serviceIds: z.array(z.string()),
  scheduleOverride: z.boolean(),
  schedule: z.array(
    z.object({ open: z.boolean(), start: z.string(), end: z.string() }),
  ),
})

type FormValues = z.infer<typeof formSchema>

export type ProfessionalFormInitial = {
  id: string
  name: string
  active: boolean
  serviceIds: string[]
  schedules: Array<{ weekday: number; startMin: number; endMin: number }>
}

type ServiceOption = { id: string; name: string; active: boolean }

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: ProfessionalFormInitial
  serviceOptions: ServiceOption[]
}

function minutesToHHmm(m: number): string {
  const h = Math.floor(m / 60).toString().padStart(2, "0")
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

function defaultSchedule(): ScheduleEntry[] {
  return WEEKDAYS.map(() => ({ open: false, start: "09:00", end: "18:00" }))
}

function scheduleFromInitial(
  rows: Array<{ weekday: number; startMin: number; endMin: number }>,
): ScheduleEntry[] {
  return WEEKDAYS.map((w) => {
    const row = rows.find((r) => r.weekday === w.value)
    return row
      ? { open: true, start: minutesToHHmm(row.startMin), end: minutesToHHmm(row.endMin) }
      : { open: false, start: "09:00", end: "18:00" }
  })
}

export function ProfessionalFormDialog({
  open,
  onOpenChange,
  initial,
  serviceOptions,
}: Props) {
  const router = useRouter()
  const isEdit = !!initial

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      active: true,
      serviceIds: [],
      scheduleOverride: false,
      schedule: defaultSchedule(),
    },
  })

  useEffect(() => {
    if (open) {
      form.reset(
        initial
          ? {
              name: initial.name,
              active: initial.active,
              serviceIds: initial.serviceIds,
              scheduleOverride: initial.schedules.length > 0,
              schedule:
                initial.schedules.length > 0
                  ? scheduleFromInitial(initial.schedules)
                  : defaultSchedule(),
            }
          : {
              name: "",
              active: true,
              serviceIds: [],
              scheduleOverride: false,
              schedule: defaultSchedule(),
            },
      )
    }
  }, [open, initial, form])

  async function onSubmit(values: FormValues) {
    let schedulesPayload: Array<{ weekday: number; startMin: number; endMin: number }> | undefined

    if (values.scheduleOverride) {
      const rows: Array<{ weekday: number; startMin: number; endMin: number }> = []
      for (let i = 0; i < WEEKDAYS.length; i++) {
        const d = values.schedule[i]
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
        rows.push({ weekday: WEEKDAYS[i].value, startMin, endMin })
      }
      schedulesPayload = rows
    } else if (isEdit && initial!.schedules.length > 0) {
      // Era override antes, agora não é → enviamos array vazio pra apagar
      schedulesPayload = []
    }

    const payload = {
      name: values.name,
      active: values.active,
      serviceIds: values.serviceIds,
      ...(schedulesPayload !== undefined ? { schedules: schedulesPayload } : {}),
    }

    const res = await fetch(
      isEdit ? `/api/professionals/${initial!.id}` : "/api/professionals",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    )

    if (!res.ok) {
      toast.error("Não foi possível salvar.")
      return
    }
    toast.success(isEdit ? "Profissional atualizado" : "Profissional criado")
    onOpenChange(false)
    router.refresh()
  }

  const scheduleOverride = useWatch({
    control: form.control,
    name: "scheduleOverride",
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar profissional" : "Novo profissional"}
          </DialogTitle>
          <DialogDescription>
            Escolha os serviços e (opcional) horários personalizados.
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
                    <Input placeholder="Ex.: Carlos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serviceIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serviços</FormLabel>
                  <div className="border rounded-md divide-y max-h-56 overflow-y-auto">
                    {serviceOptions.length === 0 ? (
                      <p className="p-3 text-xs text-muted-foreground">
                        Cadastre serviços primeiro.
                      </p>
                    ) : (
                      serviceOptions.map((s) => {
                        const checked = field.value.includes(s.id)
                        return (
                          <label
                            key={s.id}
                            className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/40 text-sm"
                          >
                            <input
                              type="checkbox"
                              className="size-4 rounded border-input"
                              checked={checked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...field.value, s.id]
                                  : field.value.filter((id) => id !== s.id)
                                field.onChange(next)
                              }}
                            />
                            <span>{s.name}</span>
                            {!s.active ? (
                              <span className="text-xs text-muted-foreground">
                                (inativo)
                              </span>
                            ) : null}
                          </label>
                        )
                      })
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scheduleOverride"
              render={({ field }) => (
                <FormItem className="border rounded-md p-3">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-input mt-0.5"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                    <div className="flex-1">
                      <FormLabel className="!mt-0">
                        Horário personalizado
                      </FormLabel>
                      <FormDescription className="mt-1">
                        Sobrescreve o horário do salão. Sem isso, segue o
                        funcionamento padrão.
                      </FormDescription>
                    </div>
                  </label>
                </FormItem>
              )}
            />

            {scheduleOverride ? (
              <div className="space-y-2">
                {WEEKDAYS.map((w, i) => (
                  <FormField
                    key={w.value}
                    control={form.control}
                    name={`schedule.${i}`}
                    render={({ field }) => (
                      <div className="flex items-center gap-3 px-3 py-2 border rounded-md">
                        <label className="flex items-center gap-2 w-28 shrink-0">
                          <input
                            type="checkbox"
                            className="size-4 rounded border-input"
                            checked={field.value.open}
                            onChange={(e) =>
                              field.onChange({ ...field.value, open: e.target.checked })
                            }
                          />
                          <span className="text-sm font-medium">{w.label}</span>
                        </label>
                        {field.value.open ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              type="time"
                              value={field.value.start}
                              onChange={(e) =>
                                field.onChange({ ...field.value, start: e.target.value })
                              }
                              className="w-28"
                            />
                            <span className="text-xs text-muted-foreground">até</span>
                            <Input
                              type="time"
                              value={field.value.end}
                              onChange={(e) =>
                                field.onChange({ ...field.value, end: e.target.value })
                              }
                              className="w-28"
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Folga</span>
                        )}
                      </div>
                    )}
                  />
                ))}
              </div>
            ) : null}

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
                  <FormLabel className="!mt-0">
                    Ativo (atende clientes)
                  </FormLabel>
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
                {form.formState.isSubmitting
                  ? "Salvando..."
                  : isEdit
                    ? "Salvar"
                    : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
