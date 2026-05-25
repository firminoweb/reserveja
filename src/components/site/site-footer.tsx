import Link from "next/link"

import { Logo } from "@/components/ui/logo"

export function SiteFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Link
          href="/"
          aria-label="Conheça o Reserve Já"
          className="inline-flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
        >
          <Logo iconClassName="size-6" textClassName="text-sm" />
        </Link>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
          <nav className="flex items-center gap-3 text-xs text-muted-foreground">
            <Link
              href="/termos"
              className="hover:text-foreground underline-offset-4 hover:underline"
            >
              Termos
            </Link>
            <Link
              href="/privacidade"
              className="hover:text-foreground underline-offset-4 hover:underline"
            >
              Privacidade
            </Link>
          </nav>
          <p className="text-xs text-muted-foreground text-center sm:text-right">
            Agendamentos online por{" "}
            <Link
              href="/"
              className="font-medium text-foreground hover:text-primary underline-offset-4 hover:underline"
            >
              Reserve Já
            </Link>
            . Crie o seu também.
          </p>
        </div>
      </div>
    </footer>
  )
}
