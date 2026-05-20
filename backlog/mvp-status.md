# Reserve Já — status do MVP

Última atualização: 2026-05-19

Documento vivo. Atualizar quando algo sair desta lista ou quando descobrir nova
pendência durante o piloto. Para detalhes técnicos do projeto, ver `CLAUDE.md`.

---

## ✅ Done — punch list MVP

| # | Item |
|---|---|
| 1 | CRUD de serviços no painel |
| 2 | CRUD de profissionais + associação prof↔serviço |
| 3 | Horário de funcionamento editável |
| 4 | Bloqueios de horário (TimeBlock) |
| 5 | Marcar booking COMPLETED / NO_SHOW |
| 6 | Confirmação WhatsApp ao agendar (Evolution) |
| 7 | Lembrete 1h antes via cron |
| 8 | Onboarding self-service em `/cadastro` |
| 9 | Configurações do salão |
| 10 | Recuperação de senha (Resend) |

Polimentos da sessão também aplicados: slug bloqueia duplicado com check ao vivo,
WhatsApp formatado em todos os pontos, `MoneyInput` BRL em centavos, locale pt-BR
do Zod, `.trim()` em campos texto.

---

## 🚀 Pra ir pra produção (operacional, não código)

- [ ] Provisionar Postgres prod com extensão `btree_gist` (Vercel Postgres, Neon, Supabase ou Railway servem).
- [ ] Rodar `yarn prisma migrate deploy` no banco de prod (4 migrations geradas até agora).
- [ ] Conta Resend criada + domínio próprio verificado (senão emails caem no spam).
- [ ] Instância Evolution API conectada a um WhatsApp (QR code escaneado).
- [ ] Deploy na Vercel — `vercel.json` já liga o cron de lembretes (`*/5 * * * *`).
- [ ] Domínio próprio apontado + SSL (Vercel cuida).
- [ ] Setar envs em produção (lista abaixo).

### Envs obrigatórias em prod

```bash
DATABASE_URL=""
AUTH_SECRET=""              # openssl rand -base64 32
AUTH_URL="https://reserveja.app"
NEXT_PUBLIC_APP_URL="https://reserveja.app"

# Resend (reset de senha)
RESEND_API_KEY=""
RESEND_FROM_EMAIL=""

# Evolution (WhatsApp)
EVOLUTION_API_URL=""
EVOLUTION_API_KEY=""
EVOLUTION_INSTANCE=""

# Cron de lembretes
CRON_SECRET=""              # openssl rand -base64 32
```

Sem Resend ou Evolution o app sobe — só logam warn e não enviam mensagens. Bom
pra testar fluxos sem integração.

---

## ⚠️ Limitações conhecidas — não bloqueiam o piloto

- **WorkingHour**: 1 intervalo por dia. Almoço fica em Bloqueios.
- **ProfessionalSchedule**: backend funciona, sem UI ainda.
- **Slug**: não editável depois do cadastro (link público quebraria sem redirect).
- **Upload de mídia (logo/capa)**: só URL pública por enquanto (Cloudinary/Imgur/S3 do próprio dono). Upload real precisa decisão de storage.
- **Rate-limit `/recuperar-senha`**: ausente. Abusável.
- **Testes automatizados**: nenhum.

---

## 📄 Páginas em "Em construção"

Nenhuma é caminho crítico do MVP.

### Cliente / público

- [ ] `/precos` — placeholder. Definir planos primeiro.

### Painel (dono)

- [ ] `/painel/agenda` — visão semanal/mensal. (`/painel` Hoje já funciona)
- [ ] `/painel/clientes` — histórico por telefone.

### Admin

- [ ] `/admin/usuarios` — placeholder.
- [ ] `/admin/financeiro` — MRR, planos, faturas. Depende de cobrança definida.

Páginas admin funcionais: `/admin` (métricas globais), `/admin/estabelecimentos` (lista).

---

## 📌 Pós-MVP (nice-to-have, não urgente)

- Multi-establishment UI (modelo `Membership` já suporta).
- QR code generator por salão (link da vitrine).
- Histórico/CRM de clientes por telefone.
- Página de marketing detalhada (landing, FAQ).
- Pagamento integrado (Stripe/Pagar.me) se cobrar mensalidade.
- Notificação de cancelamento via WhatsApp (quando dono cancela).
- Tabela `Notification` pra log de envios e retry.
- Edição de slug com redirect slug-antigo → novo.
- Override de horário por profissional na UI.
- Upload real de mídia (Vercel Blob é o caminho natural).
- Testes (Vitest unit + Playwright E2E).
