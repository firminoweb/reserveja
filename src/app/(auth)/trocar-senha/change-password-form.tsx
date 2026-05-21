"use client"

import { useRouter } from "next/navigation"
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
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validations/password-reset"
import { changePasswordAction } from "./actions"

export function ChangePasswordForm() {
  const router = useRouter()

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  })
  const password = useWatch({ control: form.control, name: "newPassword" })

  async function onSubmit(values: ChangePasswordInput) {
    const res = await changePasswordAction(values)
    if (!res.ok) {
      if (res.field) {
        form.setError(res.field, { message: res.message })
      } else {
        toast.error(res.message)
      }
      return
    }
    toast.success("Senha atualizada")
    router.push(res.redirectTo)
    router.refresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha atual (a que você recebeu)</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPassword"
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
          {form.formState.isSubmitting ? "Salvando..." : "Atualizar senha"}
        </Button>
      </form>
    </Form>
  )
}
