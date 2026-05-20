"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { formatNationalBR, maskBR } from "@/lib/phone"
import {
  updateUnitSchema,
  type UpdateUnitInput,
} from "@/lib/validations/establishment-update-by-id"
import { updateUnitAction } from "@/app/(panel)/painel/unidades/actions"

const TIMEZONES = [
  "America/Sao_Paulo",
  "America/Bahia",
  "America/Fortaleza",
  "America/Recife",
  "America/Belem",
  "America/Manaus",
  "America/Cuiaba",
  "America/Boa_Vista",
  "America/Porto_Velho",
  "America/Rio_Branco",
  "America/Noronha",
] as const

export type UnitEditInitial = {
  id: string
  name: string
  description: string | null
  whatsapp: string
  timezone: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  unit: UnitEditInitial | null
}

export function UnitEditDialog({ open, onOpenChange, unit }: Props) {
  const router = useRouter()

  const form = useForm<UpdateUnitInput>({
    resolver: zodResolver(updateUnitSchema),
    defaultValues: {
      name: "",
      description: "",
      whatsapp: "",
      timezone: "America/Sao_Paulo",
    },
  })

  useEffect(() => {
    if (open && unit) {
      form.reset({
        name: unit.name,
        description: unit.description ?? "",
        whatsapp: formatNationalBR(unit.whatsapp),
        timezone: unit.timezone,
      })
    }
  }, [open, unit, form])

  if (!unit) return null

  const tzOptions = TIMEZONES.includes(unit.timezone as (typeof TIMEZONES)[number])
    ? TIMEZONES
    : ([...TIMEZONES, unit.timezone] as readonly string[])

  async function onSubmit(values: UpdateUnitInput) {
    if (!unit) return
    const res = await updateUnitAction(unit.id, values)
    if (!res.ok) {
      if (res.field) form.setError(res.field, { message: res.message })
      else toast.error(res.message)
      return
    }
    toast.success("Unidade atualizada")
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar unidade</DialogTitle>
          <DialogDescription>
            Estes dados aparecem na vitrine pública desta unidade.
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
                    <Input {...field} />
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
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Aparece na vitrine" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="tel"
                      {...field}
                      onChange={(e) => field.onChange(maskBR(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fuso horário</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="flex h-11 w-full rounded-md border border-input bg-transparent px-3.5 py-2 text-base shadow-xs focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/40 outline-none"
                    >
                      {tzOptions.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
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
                {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
