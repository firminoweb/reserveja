import type { Metadata } from "next"
import Link from "next/link"

import { Logo } from "@/components/ui/logo"
import { SiteFooter } from "@/components/site/site-footer"

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Política de privacidade da plataforma Reserve Já — como coletamos, usamos e protegemos seus dados.",
}

export default function PrivacidadePage() {
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
        <h1 className="text-3xl font-bold">Política de Privacidade</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última atualização: 25 de maio de 2026
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/90 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-10 [&_h2]:mb-3 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_table]:w-full [&_table]:text-left [&_th]:py-2 [&_th]:pr-4 [&_th]:font-medium [&_td]:py-2 [&_td]:pr-4 [&_td]:align-top">
          <section>
            <h2>1. Quem Somos</h2>
            <p>
              A plataforma Reserve Já é operada por <strong>J. H. FIRMINO &amp;
              CIA LTDA</strong>, CNPJ 43.699.300/0001-13 (&quot;Controladora&quot;),
              em conformidade com a Lei Geral de Proteção de Dados (Lei
              13.709/2018 — LGPD).
            </p>
            <p>
              Encarregado de dados (DPO):{" "}
              <a
                href="mailto:contato@reserveja.app"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                contato@reserveja.app
              </a>
            </p>
          </section>

          <section>
            <h2>2. Dados que Coletamos</h2>

            <h3 className="mt-4 mb-2 font-medium">Clientes finais (quem agenda)</h3>
            <table>
              <thead>
                <tr className="border-b">
                  <th>Dado</th>
                  <th>Finalidade</th>
                  <th>Base legal</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td>Nome</td>
                  <td>Identificar o agendamento</td>
                  <td>Execução de contrato</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td>Telefone</td>
                  <td>Confirmação e lembrete via WhatsApp</td>
                  <td>Execução de contrato</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td>E-mail (opcional)</td>
                  <td>Confirmação, .ics de calendário e cancelamento</td>
                  <td>Execução de contrato</td>
                </tr>
              </tbody>
            </table>

            <h3 className="mt-6 mb-2 font-medium">Estabelecimentos (quem usa o painel)</h3>
            <table>
              <thead>
                <tr className="border-b">
                  <th>Dado</th>
                  <th>Finalidade</th>
                  <th>Base legal</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td>Nome, e-mail, senha</td>
                  <td>Autenticação e acesso ao painel</td>
                  <td>Execução de contrato</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td>CPF ou CNPJ</td>
                  <td>Identificação fiscal da organização</td>
                  <td>Obrigação legal</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td>Endereço, WhatsApp</td>
                  <td>Exibição no perfil público do estabelecimento</td>
                  <td>Execução de contrato</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2>3. Como Usamos os Dados</h2>
            <ul>
              <li>Processar e confirmar agendamentos.</li>
              <li>Enviar notificações transacionais (confirmação, lembrete, cancelamento) por WhatsApp, e-mail e push.</li>
              <li>Exibir informações do estabelecimento na página pública.</li>
              <li>Gerar estatísticas agregadas e anônimas para melhorar a Plataforma.</li>
              <li>Cumprir obrigações legais e regulatórias.</li>
            </ul>
            <p>
              <strong>Não vendemos</strong> dados pessoais a terceiros e não
              utilizamos seus dados para publicidade comportamental.
            </p>
          </section>

          <section>
            <h2>4. Compartilhamento de Dados</h2>
            <p>Seus dados podem ser compartilhados exclusivamente com:</p>
            <ul>
              <li>
                <strong>O estabelecimento</strong> com o qual você agendou (nome,
                telefone e e-mail do cliente são exibidos no painel do
                estabelecimento).
              </li>
              <li>
                <strong>Prestadores de serviço essenciais</strong>: provedor de
                e-mail transacional (Resend), gateway de WhatsApp (Evolution API),
                infraestrutura de hospedagem (Vercel) e banco de dados (PostgreSQL
                em nuvem). Todos tratam os dados sob nossas instruções e com
                obrigações de confidencialidade.
              </li>
              <li>
                <strong>Autoridades públicas</strong>, quando exigido por lei ou
                decisão judicial.
              </li>
            </ul>
          </section>

          <section>
            <h2>5. Cookies e Tecnologias Similares</h2>
            <p>Utilizamos apenas cookies estritamente necessários:</p>
            <ul>
              <li>
                <strong>Cookie de sessão</strong> (<code>authjs.session-token</code>):
                mantém o login de estabelecimentos.
              </li>
              <li>
                <strong>Cookie de unidade selecionada</strong> (<code>rj_unit</code>):
                lembra qual unidade do estabelecimento está ativa no painel.
              </li>
            </ul>
            <p>
              Não utilizamos cookies de rastreamento, analytics ou publicidade.
            </p>
          </section>

          <section>
            <h2>6. Retenção de Dados</h2>
            <ul>
              <li>
                <strong>Dados de agendamento</strong>: mantidos enquanto a conta
                do estabelecimento estiver ativa, para fins de histórico. Após
                exclusão da conta, os dados são anonimizados em até 90 dias.
              </li>
              <li>
                <strong>Dados de conta</strong>: mantidos enquanto a conta
                existir. Após solicitação de exclusão, removidos em até 30 dias.
              </li>
            </ul>
          </section>

          <section>
            <h2>7. Seus Direitos (LGPD, Art. 18)</h2>
            <p>Você pode, a qualquer momento, solicitar:</p>
            <ul>
              <li>Confirmação de que tratamos seus dados.</li>
              <li>Acesso aos dados que temos sobre você.</li>
              <li>Correção de dados incompletos ou desatualizados.</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários.</li>
              <li>Portabilidade dos dados a outro fornecedor.</li>
              <li>Revogação do consentimento, quando aplicável.</li>
            </ul>
            <p>
              Para exercer qualquer direito, envie e-mail para{" "}
              <a
                href="mailto:contato@reserveja.app"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                contato@reserveja.app
              </a>{" "}
              com o assunto &quot;Direitos LGPD&quot;. Responderemos em até 15
              dias úteis.
            </p>
          </section>

          <section>
            <h2>8. Segurança</h2>
            <p>
              Adotamos medidas técnicas e organizacionais para proteger seus
              dados, incluindo:
            </p>
            <ul>
              <li>Conexões criptografadas (HTTPS/TLS) em toda a Plataforma.</li>
              <li>Senhas armazenadas com hash bcrypt (nunca em texto plano).</li>
              <li>Tokens de agendamento gerados criptograficamente (unguessable).</li>
              <li>Cabeçalhos de segurança HTTP (CSP, HSTS, X-Frame-Options).</li>
              <li>Constraint de banco de dados contra sobreposição de horários.</li>
            </ul>
            <p>
              Nenhum sistema é 100% seguro. Em caso de incidente de segurança
              que afete seus dados, comunicaremos os titulares e a ANPD conforme
              exigido pela LGPD.
            </p>
          </section>

          <section>
            <h2>9. Alterações nesta Política</h2>
            <p>
              Podemos atualizar esta Política periodicamente. Alterações
              relevantes serão comunicadas por e-mail ou aviso na Plataforma. A
              versão vigente estará sempre disponível nesta página.
            </p>
          </section>

          <section>
            <h2>10. Contato</h2>
            <p>
              J. H. FIRMINO &amp; CIA LTDA — CNPJ 43.699.300/0001-13
              <br />
              E-mail:{" "}
              <a
                href="mailto:contato@reserveja.app"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                contato@reserveja.app
              </a>
            </p>
          </section>
        </div>
      </article>

      <SiteFooter />
    </main>
  )
}
