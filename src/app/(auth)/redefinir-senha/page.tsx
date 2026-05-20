import Link from "next/link"

import { ResetForm } from "./reset-form"

type Search = { token?: string | string[] }

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const search = await searchParams
  const tokenParam = search.token
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam

  return (
    <main className="min-h-svh flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-lg font-bold">
          Reserve Já
        </Link>
        <h1 className="mt-8 text-2xl font-semibold text-center">
          Redefinir senha
        </h1>

        {token ? (
          <ResetForm token={token} />
        ) : (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Link inválido — peça um novo em</p>
            <Link href="/recuperar-senha" className="underline">
              recuperar senha
            </Link>
            .
          </div>
        )}
      </div>
    </main>
  )
}
