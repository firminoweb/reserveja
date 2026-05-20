"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

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
import {
  requestResetSchema,
  type RequestResetInput,
} from "@/lib/validations/password-reset"
import { requestResetAction } from "./actions"

export function RequestResetForm() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)

  const form = useForm<RequestResetInput>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: { email: "" },
  })

  async function onSubmit(values: RequestResetInput) {
    const res = await requestResetAction(values)
    if (!res.ok) {
      if (res.field) form.setError(res.field, { message: res.message })
      else toast.error(res.message)
      return
    }
    setSubmittedEmail(values.email)
  }

  if (submittedEmail) {
    return (
      <div className="mt-6 space-y-3 text-sm">
        <p>
          Se houver uma conta para <strong>{submittedEmail}</strong>, enviamos
          um email com o link pra redefinir sua senha.
        </p>
        <p className="text-muted-foreground">
          Não recebeu? Cheque o spam ou peça um novo link em alguns minutos.
        </p>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Enviando..." : "Enviar link"}
        </Button>
      </form>
    </Form>
  )
}
