"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordStrength } from "@/components/ui/password-strength"
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
  confirmResetSchema,
  type ConfirmResetInput,
} from "@/lib/validations/password-reset"
import { confirmResetAction } from "./actions"

type Props = { token: string }

export function ResetForm({ token }: Props) {
  const [done, setDone] = useState(false)

  const form = useForm<ConfirmResetInput>({
    resolver: zodResolver(confirmResetSchema),
    defaultValues: { token, password: "" },
  })
  const password = useWatch({ control: form.control, name: "password" })

  async function onSubmit(values: ConfirmResetInput) {
    const res = await confirmResetAction(values)
    if (!res.ok) {
      toast.error(res.message)
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="mt-6 space-y-3 text-center text-sm">
        <p>Senha redefinida! Pode entrar agora.</p>
        <Button asChild className="w-full">
          <Link href="/login">Ir pro login</Link>
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nova senha</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <PasswordStrength password={password ?? ""} />
              <FormDescription>Pelo menos 8 caracteres.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Salvando..." : "Redefinir senha"}
        </Button>
      </form>
    </Form>
  )
}
