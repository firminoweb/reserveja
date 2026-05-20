import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <main className="flex-1">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-2">
          <span className="text-lg md:text-xl font-bold tracking-tight">Reserve Já</span>
          <nav className="flex items-center gap-1 md:gap-2">
            <Link
              href="/precos"
              className="hidden sm:inline-block text-sm text-muted-foreground hover:text-foreground px-3 py-2"
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

      <section className="mx-auto max-w-4xl px-4 md:px-6 py-12 md:py-24 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight">
          Agendamentos sem complicação
          <br className="hidden sm:inline" />
          <span className="text-muted-foreground"> para o seu negócio.</span>
        </h1>
        <p className="mt-4 md:mt-6 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
          Seu cliente agenda em 3 cliques pelo link do salão. Você gerencia tudo num painel
          simples — sem app, sem cadastro pro cliente, sem fila no WhatsApp.
        </p>
        <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/cadastro">Criar minha página grátis</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/barbearia-do-joao">Ver exemplo</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 md:px-6 py-10 md:py-16 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
        {[
          { t: "1. Cliente escolhe", d: "Serviço, profissional e horário num link único." },
          { t: "2. Confirmação automática", d: "WhatsApp dispara mensagem na hora e lembrete 1h antes." },
          { t: "3. Você só atende", d: "A agenda chega pronta — sem combinar horário a cada cliente." },
        ].map((f) => (
          <div key={f.t} className="rounded-xl border p-5 md:p-6">
            <h3 className="font-semibold">{f.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
          </div>
        ))}
      </section>

      <footer className="border-t mt-auto">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} Reserve Já
        </div>
      </footer>
    </main>
  )
}
