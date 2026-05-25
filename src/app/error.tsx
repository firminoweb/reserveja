"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[error-boundary]", error)
  }, [error])

  return (
    <main className="min-h-svh flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm text-center">
        <Link href="/" aria-label="Reserve Já — início">
          <Logo iconClassName="size-10 mx-auto" textClassName="text-xl" />
        </Link>

        <div className="mt-10 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mx-auto">
          <AlertTriangle className="size-6" />
        </div>

        <h1 className="mt-6 text-2xl font-bold">Algo deu errado</h1>
        <p className="mt-2 text-muted-foreground">
          Ocorreu um erro inesperado. Tente novamente ou volte ao início.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Button onClick={reset} size="lg" className="w-full">
            Tentar novamente
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href="/">Voltar ao início</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
