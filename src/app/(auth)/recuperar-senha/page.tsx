import Link from "next/link"

import { RequestResetForm } from "./request-reset-form"

export default function RecuperarSenhaPage() {
  return (
    <main className="min-h-svh flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-lg font-bold">
          Reserve Já
        </Link>
        <h1 className="mt-8 text-2xl font-semibold text-center">
          Recuperar senha
        </h1>
        <p className="mt-1 text-sm text-center text-muted-foreground">
          Vamos te mandar um link por email.
        </p>

        <RequestResetForm />

        <p className="mt-6 text-sm text-center text-muted-foreground">
          Lembrou da senha?{" "}
          <Link href="/login" className="underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  )
}
