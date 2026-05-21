import Link from "next/link"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { Logo } from "@/components/ui/logo"
import { RegisterForm } from "./register-form"

export default async function CadastroPage() {
  const session = await auth()
  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/painel")
  }

  return (
    <main className="min-h-svh flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="flex justify-center" aria-label="Início">
          <Logo iconClassName="size-10" textClassName="text-xl" />
        </Link>
        <h1 className="mt-8 text-2xl font-semibold text-center">Criar conta</h1>
        <p className="mt-1 text-sm text-center text-muted-foreground">
          Em menos de 1 minuto seu salão está pronto pra receber agendamentos.
        </p>

        <RegisterForm />

        <p className="mt-6 text-sm text-center text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  )
}
