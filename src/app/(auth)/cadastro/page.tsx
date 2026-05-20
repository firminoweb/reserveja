import Link from "next/link"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { RegisterForm } from "./register-form"

export default async function CadastroPage() {
  const session = await auth()
  if (session?.user) redirect("/painel")

  return (
    <main className="min-h-svh flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="block text-center text-lg font-bold">
          Reserve Já
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
