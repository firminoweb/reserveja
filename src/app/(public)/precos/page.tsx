import type { Metadata } from "next"
import Link from "next/link"
import { Check, Sparkles } from "lucide-react"

import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Logo, LogoMark } from "@/components/ui/logo"
import { UserMenu } from "@/components/site/user-menu"
import { SiteFooter } from "@/components/site/site-footer"

export const metadata: Metadata = {
  title: "Preços",
  description:
    "Comece grátis com o Reserve Já. Veja os planos disponíveis para salões, barbearias e prestadores de serviço.",
}

const FREE_FEATURES = [
  "Página pública de agendamento",
  "Confirmação por WhatsApp",
  "Confirmação por e-mail + calendário",
  "Painel de gestão",
  "1 unidade",
  "Até 2 profissionais",
  "50 agendamentos/mês",
]

const PRO_FEATURES = [
  "Tudo do plano Grátis",
  "Até 3 unidades",
  "Profissionais ilimitados",
  "Agendamentos ilimitados",
  "Lembretes automáticos",
  "Relatórios e métricas",
]

const ENTERPRISE_FEATURES = [
  "Tudo do plano Profissional",
  "Unidades ilimitadas",
  "Suporte prioritário",
  "API de integração",
]

const FAQS = [
  {
    q: "Preciso de cartão de crédito pra começar?",
    a: "Não. O plano Grátis não exige cartão, pagamento ou compromisso. Você cria sua conta e já pode usar.",
  },
  {
    q: "Posso trocar de plano depois?",
    a: "Sim. Quando os planos pagos estiverem disponíveis, você poderá fazer upgrade a qualquer momento sem perder dados.",
  },
  {
    q: "Meus clientes precisam baixar algum app?",
    a: "Não. Seus clientes agendam pelo link do seu estabelecimento, direto no navegador — sem app, sem cadastro.",
  },
  {
    q: "E se eu passar do limite de 50 agendamentos no plano Grátis?",
    a: "Novos agendamentos ficam bloqueados até o próximo mês. Você será avisado antes de atingir o limite.",
  },
]

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 space-y-2.5 flex-1">
      {items.map((label) => (
        <li key={label} className="flex items-start gap-2 text-sm">
          <Check className="size-4 shrink-0 text-emerald-600 mt-0.5" />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  )
}

export default async function PrecosPage() {
  const session = await auth()
  const user = session?.user

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
              className="hidden sm:inline-block text-sm font-medium text-foreground px-3 py-2"
            >
              Preços
            </Link>
            {user ? (
              <UserMenu
                name={user.name ?? null}
                email={user.email ?? ""}
                role={user.role}
              />
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="md:h-10">
                  <Link href="/login">Entrar</Link>
                </Button>
                <Button asChild size="sm" className="md:h-10">
                  <Link href="/cadastro">Começar grátis</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-4xl px-4 md:px-6 pt-14 md:pt-20 pb-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Comece grátis.{" "}
          <span className="text-primary">Cresça quando precisar.</span>
        </h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
          O plano Grátis já inclui tudo pra você começar a receber agendamentos
          hoje. Sem cartão, sem compromisso.
        </p>
      </section>

      {/* PLANS */}
      <section className="mx-auto max-w-5xl px-4 md:px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* GRÁTIS */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col">
            <h3 className="text-lg font-semibold">Grátis</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Pra quem está começando
            </p>
            <div className="mt-5">
              <span className="text-4xl font-bold">R$ 0</span>
              <span className="text-sm text-muted-foreground">/mês</span>
            </div>
            <Button asChild size="lg" className="mt-6 w-full">
              <Link href="/cadastro">Começar grátis</Link>
            </Button>
            <FeatureList items={FREE_FEATURES} />
          </div>

          {/* PROFISSIONAL */}
          <div className="rounded-2xl border-2 border-primary bg-card p-6 shadow-lg flex flex-col relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
              <Sparkles className="size-3" aria-hidden />
              Mais popular
            </span>
            <h3 className="text-lg font-semibold">Profissional</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Pra negócios em crescimento
            </p>
            <div className="mt-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Em breve
              </span>
            </div>
            <Button size="lg" className="mt-6 w-full" disabled>
              Avise-me quando lançar
            </Button>
            <FeatureList items={PRO_FEATURES} />
          </div>

          {/* EMPRESARIAL */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col">
            <h3 className="text-lg font-semibold">Empresarial</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Pra redes e franquias
            </p>
            <div className="mt-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Em breve
              </span>
            </div>
            <Button size="lg" variant="outline" className="mt-6 w-full" disabled>
              Avise-me quando lançar
            </Button>
            <FeatureList items={ENTERPRISE_FEATURES} />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 md:px-6 pb-16 md:pb-20">
        <h2 className="text-2xl font-bold text-center">Perguntas frequentes</h2>
        <div className="mt-8 space-y-3">
          {FAQS.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-xl border bg-card shadow-sm"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-medium [&::-webkit-details-marker]:hidden list-none">
                {faq.q}
                <span className="shrink-0 text-muted-foreground transition-transform group-open:rotate-45 text-lg leading-none">
                  +
                </span>
              </summary>
              <p className="px-5 pb-4 text-sm text-muted-foreground">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 md:px-6 pb-16 md:pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-8 md:p-12 text-center">
          <div
            className="absolute -top-16 -right-16 size-60 rounded-full bg-primary-foreground/10 blur-2xl"
            aria-hidden
          />
          <div className="relative">
            <LogoMark className="mx-auto size-14" onDark />
            <h2 className="mt-4 text-2xl md:text-3xl font-bold">
              Pronto pra organizar sua agenda?
            </h2>
            <p className="mt-2 text-primary-foreground/85 max-w-xl mx-auto">
              Crie sua página em menos de 2 minutos. Grátis enquanto seu negócio
              estiver começando.
            </p>
            <div className="mt-6">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <Link href="/cadastro">Criar minha página grátis</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
