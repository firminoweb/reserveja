import type { Metadata } from "next"
import Link from "next/link"

import { Logo } from "@/components/ui/logo"
import { SiteFooter } from "@/components/site/site-footer"

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Termos de uso da plataforma Reserve Já.",
}

export default function TermosPage() {
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
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 md:px-6 py-12 md:py-16">
        <h1 className="text-3xl font-bold">Termos de Uso</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última atualização: 25 de maio de 2026
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/90 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-10 [&_h2]:mb-3 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
          <section>
            <h2>1. Aceitação dos Termos</h2>
            <p>
              Ao acessar ou utilizar a plataforma Reserve Já (&quot;Plataforma&quot;),
              operada por J. H. FIRMINO &amp; CIA LTDA, inscrita no CNPJ
              43.699.300/0001-13 (&quot;Nós&quot;), você concorda integralmente com
              estes Termos de Uso. Se não concordar, não utilize a Plataforma.
            </p>
          </section>

          <section>
            <h2>2. Descrição do Serviço</h2>
            <p>
              O Reserve Já é uma plataforma de agendamento online que permite a
              estabelecimentos (salões, barbearias, mecânicas e prestadores de
              serviço em geral) disponibilizar sua agenda para clientes finais.
            </p>
            <ul>
              <li>
                <strong>Estabelecimentos</strong> criam uma conta, configuram
                serviços, profissionais e horários, e recebem um link público para
                compartilhar com clientes.
              </li>
              <li>
                <strong>Clientes finais</strong> acessam o link, escolhem serviço,
                profissional e horário, e confirmam o agendamento fornecendo nome,
                telefone e e-mail.
              </li>
            </ul>
          </section>

          <section>
            <h2>3. Cadastro e Conta</h2>
            <p>
              O cadastro é necessário somente para estabelecimentos. O
              estabelecimento é responsável por manter suas credenciais em
              sigilo. Qualquer atividade realizada sob sua conta é de sua
              responsabilidade.
            </p>
            <p>
              Clientes finais não precisam criar conta. Seus dados (nome,
              telefone e e-mail) são coletados exclusivamente para viabilizar o
              agendamento e enviar notificações relacionadas.
            </p>
          </section>

          <section>
            <h2>4. Obrigações do Estabelecimento</h2>
            <ul>
              <li>Fornecer informações verdadeiras e atualizadas no cadastro.</li>
              <li>
                Manter os dados dos clientes finais em conformidade com a legislação
                aplicável, incluindo a LGPD (Lei 13.709/2018).
              </li>
              <li>
                Não utilizar a Plataforma para fins ilegais, fraudulentos ou que
                violem direitos de terceiros.
              </li>
              <li>
                Respeitar os agendamentos confirmados. Cancelamentos recorrentes
                sem justificativa podem resultar em suspensão da conta.
              </li>
            </ul>
          </section>

          <section>
            <h2>5. Obrigações do Cliente Final</h2>
            <ul>
              <li>
                Fornecer dados corretos ao realizar um agendamento (nome, telefone
                e e-mail, quando solicitado).
              </li>
              <li>
                Comparecer ao horário agendado ou cancelar com antecedência
                razoável pelo link de gerenciamento recebido.
              </li>
            </ul>
          </section>

          <section>
            <h2>6. Planos e Pagamento</h2>
            <p>
              A Plataforma oferece um plano gratuito com recursos limitados.
              Planos pagos com funcionalidades adicionais poderão ser
              disponibilizados futuramente. Eventuais cobranças serão comunicadas
              previamente e dependerão de aceitação expressa do estabelecimento.
            </p>
          </section>

          <section>
            <h2>7. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo da Plataforma (marca, layout, textos, ícones e
              código) é de propriedade de J. H. FIRMINO &amp; CIA LTDA ou
              licenciado por terceiros. É vedada a reprodução, distribuição ou
              criação de obras derivadas sem autorização prévia.
            </p>
          </section>

          <section>
            <h2>8. Limitação de Responsabilidade</h2>
            <p>
              O Reserve Já é uma ferramenta de agendamento. Não nos
              responsabilizamos por:
            </p>
            <ul>
              <li>
                Qualidade, pontualidade ou execução dos serviços prestados pelo
                estabelecimento ao cliente final.
              </li>
              <li>
                Conflitos entre estabelecimento e cliente decorrentes do serviço
                agendado.
              </li>
              <li>
                Indisponibilidade temporária da Plataforma por motivos de força
                maior, manutenção ou falha de infraestrutura de terceiros.
              </li>
            </ul>
          </section>

          <section>
            <h2>9. Suspensão e Encerramento</h2>
            <p>
              Reservamo-nos o direito de suspender ou encerrar contas que violem
              estes Termos, pratiquem fraude, spam, ou uso abusivo da
              Plataforma, mediante notificação prévia quando possível.
            </p>
          </section>

          <section>
            <h2>10. Alterações nos Termos</h2>
            <p>
              Podemos atualizar estes Termos a qualquer momento. Alterações
              relevantes serão comunicadas por e-mail ou aviso na Plataforma. O
              uso continuado após a comunicação constitui aceitação dos novos
              termos.
            </p>
          </section>

          <section>
            <h2>11. Legislação Aplicável e Foro</h2>
            <p>
              Estes Termos são regidos pela legislação da República Federativa
              do Brasil. Fica eleito o foro da comarca da sede da empresa para
              dirimir eventuais disputas.
            </p>
          </section>

          <section>
            <h2>12. Contato</h2>
            <p>
              Para dúvidas sobre estes Termos, entre em contato pelo e-mail{" "}
              <a
                href="mailto:contato@reserveja.app"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                contato@reserveja.app
              </a>
              .
            </p>
          </section>
        </div>
      </article>

      <SiteFooter />
    </main>
  )
}
