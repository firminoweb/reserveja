import Link from "next/link"
import { SearchX } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"

export default function NotFound() {
  return (
    <main className="min-h-svh flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm text-center">
        <Link href="/" aria-label="Reserve Já — início">
          <Logo iconClassName="size-10 mx-auto" textClassName="text-xl" />
        </Link>

        <div className="mt-10 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground mx-auto">
          <SearchX className="size-6" />
        </div>

        <h1 className="mt-6 text-2xl font-bold">Página não encontrada</h1>
        <p className="mt-2 text-muted-foreground">
          O endereço que você acessou não existe ou foi removido.
        </p>

        <Button asChild size="lg" className="mt-8 w-full">
          <Link href="/">Voltar ao início</Link>
        </Button>
      </div>
    </main>
  )
}
