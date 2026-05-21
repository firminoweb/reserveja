import Link from "next/link"
import { redirect } from "next/navigation"

import { db } from "@/lib/db"
import { requireSession } from "@/server/auth/guards"
import { ChangePasswordForm } from "./change-password-form"

export default async function TrocarSenhaPage() {
  const session = await requireSession()
  // Se o usuário não está com a flag setada, manda pra área dele — não precisa
  // trocar nada. Evita cair aqui sem motivo (e bookmarks acidentais).
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { mustChangePassword: true, role: true },
  })
  if (!user) redirect("/login")
  if (!user.mustChangePassword) {
    redirect(user.role === "ADMIN" ? "/admin" : "/painel")
  }

  return (
    <main className="min-h-svh flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-lg font-bold">
          Reserve Já
        </Link>
        <h1 className="mt-8 text-2xl font-semibold text-center">
          Defina sua senha
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Sua senha atual foi gerada pelo sistema (convite ou reset). Escolha
          uma nova senha pra continuar.
        </p>
        <ChangePasswordForm />
      </div>
    </main>
  )
}
