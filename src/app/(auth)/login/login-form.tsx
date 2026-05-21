"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { getSession, signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { signInSchema, type SignInInput } from "@/lib/validations/auth"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

// Aceita apenas caminhos absolutos do próprio app (`/painel/...`). Bloqueia
// URLs externas (`https://evil.com`) e protocolo-relativos (`//evil.com`) que
// um atacante poderia injetar via `?from=` pra phishing pós-login.
function safeRedirectPath(raw: string | null): string | null {
  if (!raw) return null
  if (!raw.startsWith("/")) return null
  if (raw.startsWith("//")) return null
  if (raw.startsWith("/\\")) return null
  return raw
}

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const from = safeRedirectPath(params.get("from"))

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(data: SignInInput) {
    const res = await signIn("credentials", { ...data, redirect: false })
    if (res?.error) {
      toast.error("E-mail ou senha incorretos")
      return
    }
    let dest = from
    if (!dest) {
      const session = await getSession()
      dest = session?.user?.role === "ADMIN" ? "/admin" : "/painel"
    }
    router.push(dest)
    router.refresh()
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
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Senha</FormLabel>
                <Link
                  href="/recuperar-senha"
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Esqueci a senha
                </Link>
              </div>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </Form>
  )
}
