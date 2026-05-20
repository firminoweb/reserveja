import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <main className="flex-1">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">Reserve Já</span>
          <nav className="flex items-center gap-2">
            <Link href="/precos" className="text-sm text-muted-foreground hover:text-foreground px-3 py-2">
              Preços
            </Link>
            <Button asChild variant="ghost">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link href="/cadastro">Começar grátis</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight leading-tight">
          Agendamentos sem complicação
          <br />
          <span className="text-muted-foreground">para o seu negócio.</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Seu cliente agenda em 3 cliques pelo link do salão. Você gerencia tudo num painel
          simples — sem app, sem cadastro pro cliente, sem fila no WhatsApp.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/cadastro">Criar minha página grátis</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/barbearia-do-joao">Ver exemplo</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 grid md:grid-cols-3 gap-8">
        {[
          { t: "1. Cliente escolhe", d: "Serviço, profissional e horário num link único." },
          { t: "2. Confirmação automática", d: "WhatsApp dispara mensagem na hora e lembrete 1h antes." },
          { t: "3. Você só atende", d: "A agenda chega pronta — sem combinar horário a cada cliente." },
        ].map((f) => (
          <div key={f.t} className="rounded-xl border p-6">
            <h3 className="font-semibold">{f.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
          </div>
        ))}
      </section>

      <footer className="border-t mt-auto">
        <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} Reserve Já
        </div>
      </footer>
    </main>
  )
}
