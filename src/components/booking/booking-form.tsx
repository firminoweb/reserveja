"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { maskBR } from "@/lib/phone"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { createBookingSchema, type CreateBookingInput } from "@/lib/validations/booking"

type Props = {
  slug: string
  serviceId: string
  professionalId: string
  startsAt: string
}

export function BookingForm({ slug, serviceId, professionalId, startsAt }: Props) {
  const router = useRouter()
  const [showNotes, setShowNotes] = useState(false)

  const form = useForm<CreateBookingInput>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: {
      establishmentSlug: slug,
      serviceId,
      professionalId,
      startsAt,
      clientName: "",
      clientPhone: "",
      notes: "",
    },
  })

  async function onSubmit(data: CreateBookingInput) {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (res.status === 409) {
      toast.error("Esse horário foi reservado por outra pessoa. Escolha outro.")
      router.push(`/${slug}/agendar/profissional?serviceId=${serviceId}`)
      return
    }

    if (!res.ok) {
      toast.error("Não foi possível concluir o agendamento. Tente de novo.")
      return
    }

    const json = (await res.json()) as { id: string }
    router.push(`/${slug}/agendar/sucesso/${json.id}`)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <FormField
          control={form.control}
          name="clientName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Como você quer ser chamado" autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="clientPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>WhatsApp</FormLabel>
              <FormControl>
                <Input
                  placeholder="(11) 98765-4321"
                  autoComplete="tel"
                  inputMode="tel"
                  {...field}
                  onChange={(e) => field.onChange(maskBR(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {showNotes ? (
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Algo que o profissional precise saber" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowNotes(true)}
            className="text-xs text-muted-foreground underline"
          >
            + adicionar observação
          </button>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Confirmando..." : "Confirmar agendamento"}
        </Button>
      </form>
    </Form>
  )
}
