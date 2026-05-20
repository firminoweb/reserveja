import Link from "next/link"
import { CalendarCheck, MessageCircle, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Logo, LogoMark } from "@/components/ui/logo"

const FEATURES = [
  {
    icon: CalendarCheck,
    t: "1. Cliente escolhe",
    d: "Serviço, profissional e horário num link único — sem app, sem cadastro.",
  },
  {
    icon: MessageCircle,
    t: "2. Confirmação automática",
    d: "WhatsApp dispara mensagem na hora e lembrete 1 hora antes.",
  },
  {
    icon: Sparkles,
    t: "3. Você só atende",
    d: "A agenda chega pronta — sem combinar horário a cada cliente.",
  },
]

export default function HomePage() {
  return (
    <main className="flex-1">
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-2">
          <Link href="/" aria-label="Reserve Já — início">
            <Logo
              iconClassName="size-9 md:size-10"
              textClassName="text-lg md:text-xl"
            />
          </Link>
          <nav className="flex items-center gap-1 md:gap-2">
            <Link
              href="/precos"
              className="hidden sm:inline-block text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2"
            >
              Preços
            </Link>
            <Button asChild variant="ghost" size="sm" className="md:h-10">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild size="sm" className="md:h-10">
              <Link href="/cadastro">Começar grátis</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* HERO com fundo indigo decorativo */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/8 via-primary/3 to-transparent"
          aria-hidden
        />
        <div
          className="absolute top-0 right-0 -z-10 size-[420px] rounded-full bg-primary/15 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -top-12 -left-12 -z-10 size-[280px] rounded-full bg-accent/40 blur-3xl"
          aria-hidden
        />

        <div className="mx-auto max-w-4xl px-4 md:px-6 py-14 md:py-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" aria-hidden />
            Reservas simples. Mais tempo pro que importa.
          </span>
          <h1 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            Agendamentos sem complicação{" "}
            <span className="text-primary">pro seu negócio</span>.
          </h1>
          <p className="mt-4 md:mt-6 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Seu cliente agenda em 3 cliques pelo link do salão. Você gerencia tudo
            num painel simples — sem app, sem cadastro pro cliente, sem fila no
            WhatsApp.
          </p>
          <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <Button asChild size="lg" className="shadow-md shadow-primary/20">
              <Link href="/cadastro">Criar minha página grátis</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/barbearia-do-joao">Ver exemplo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-4 md:px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.t}
                className="rounded-2xl border bg-card p-5 md:p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden />
                </div>
                <h3 className="mt-4 font-semibold text-base">{f.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA Final */}
      <section className="mx-auto max-w-6xl px-4 md:px-6 pb-16 md:pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-8 md:p-12 text-center">
          <div
            className="absolute -top-16 -right-16 size-60 rounded-full bg-primary-foreground/10 blur-2xl"
            aria-hidden
          />
          <div className="relative">
            <LogoMark className="mx-auto size-14" onDark />
            <h2 className="mt-4 text-2xl md:text-3xl font-bold">
              Pronto pra desafogar o WhatsApp?
            </h2>
            <p className="mt-2 text-primary-foreground/85 max-w-xl mx-auto">
              Crie sua página em menos de 2 minutos. Grátis enquanto seu negócio
              estiver começando.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <Link href="/cadastro">Começar agora</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground hover:border-primary-foreground/60"
              >
                <Link href="/precos">Ver planos</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t mt-auto">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Logo iconClassName="size-7" textClassName="text-sm" />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Reserve Já — feito com café e código.
          </p>
        </div>
      </footer>
    </main>
  )
}
