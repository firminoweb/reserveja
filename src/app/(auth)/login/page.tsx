import { Suspense } from "react"
import Link from "next/link"

import { Logo } from "@/components/ui/logo"
import { LoginForm } from "./login-form"

export default function LoginPage() {
  return (
    <main className="min-h-svh flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex justify-center" aria-label="Início">
          <Logo iconClassName="size-10" textClassName="text-xl" />
        </Link>
        <h1 className="mt-8 text-2xl font-semibold text-center">Entrar</h1>

        <Suspense fallback={<div className="mt-6 h-40" />}>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-sm text-center text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="underline">Cadastre-se</Link>
        </p>
      </div>
    </main>
  )
}
