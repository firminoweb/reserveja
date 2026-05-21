# Auditoria de segurança — Reserve Já

Relatório gerado em 2026-05-21, varredura completa do código em `src/`.

> Snapshot: este documento é a **foto** dos findings na data acima. A maioria
> já foi corrigida no mesmo commit que adicionou este arquivo. O que ficou
> aberto está marcado abaixo. Não use este doc como referência viva — quando
> houver outra auditoria, anexar abaixo com nova data.

## Resumo executivo

| Severidade | Achados | Corrigidos | Pendentes |
| --- | --- | --- | --- |
| Crítico | 0 | — | 0 |
| Alto | 4 | 4 | 0 |
| Médio | 8 | 8 | 0 |
| Baixo/Info | 8 | 7 | 1 |

**Veredito pós-fixes**: pronto pra abrir pra clientes em escala reduzida.
Ainda há trabalho de defesa em profundidade (rate limit distribuído via Redis,
sandbox da Evolution etc.) mas o caminho crítico está coberto.

---

## ALTO

### ALTO-1 — Open Redirect no login via `?from=` — **corrigido**

`src/app/(auth)/login/login-form.tsx:25,39-43`

`?from=https://evil.com` redirecionava pra qualquer URL após login bem-sucedido.

**Fix**: função `safeRedirectPath` valida que o destino começa com `/` e não
com `//` (protocolo-relativo) nem `/\\`. URLs externas caem pro default
(`/painel` ou `/admin`).

### ALTO-2 — APIs públicas não checavam `OrgStatus.SUSPENDED` — **corrigido**

`src/app/api/establishments/[slug]/services/route.ts` e
`src/app/api/establishments/[slug]/professionals/route.ts`

Endpoints retornavam dados de estabelecimentos com organização suspensa.
**Fix**: adicionado `organization: { status: { not: "SUSPENDED" } }` no filtro.

### ALTO-3 — Senha temporária sem flag "trocar na primeira entrada" — **corrigido**

`src/server/team/mutations.ts`, `src/app/(admin)/admin/_actions.ts`

Senha gerada por `generateTempPassword()` (em convite de equipe ou reset por
admin) funcionava como permanente.

**Fix** (envolveu migration nova):
- Coluna `User.mustChangePassword Boolean @default(false)`
- `inviteMember` e `resetUserPasswordAction` setam `true` ao criar/redefinir
- `confirmPasswordReset` e `changePasswordAction` setam `false`
- Guards `requireOwnerMembership`, `requireRole`, `getApiOwnerContext` chamam
  `enforcePasswordChange()` que redireciona pra `/trocar-senha` se flag = true
- Nova página `/trocar-senha` com fluxo de troca usando senha atual

### ALTO-4 — Disponibilidade e criação de booking ignoravam `SUSPENDED` — **corrigido**

`src/server/booking/availability.ts:36-39`, `src/server/booking/create.ts:24-26`

Cliente conseguia ver slots e criar booking em estabelecimento suspenso.
**Fix**: mesmo filtro `organization.status` aplicado nas queries.

---

## MÉDIO

### MÉDIO-1 — Sem rate limiting — **corrigido (in-memory)**

`src/lib/auth.ts`, `src/app/(auth)/recuperar-senha/actions.ts`,
`src/app/api/establishments/check-slug/route.ts`,
`src/app/api/bookings/route.ts`,
`src/app/(auth)/trocar-senha/actions.ts`

Brute-force de senha era viável (~5-10 tentativas/s/core com bcrypt 10) e
reset de senha podia fazer flood do Resend (custo $).

**Fix**: novo módulo `src/lib/rate-limit.ts` com sliding window in-memory:

| Endpoint | Chave | Limite |
| --- | --- | --- |
| Login (NextAuth Credentials) | email | 5/min |
| Password reset | email | 3/h |
| Check-slug | IP | 60/min |
| Create booking | IP | 10/min |
| Change password | userId | 10/10min |

**Limitação conhecida**: cada instância serverless tem seu próprio `Map`, então
o limite é por-instância. Em produção com tráfego sério, migrar pra Upstash
Redis (`@upstash/ratelimit`). Pra MVP defende contra script kiddie do mesmo IP.

### MÉDIO-2 — `CRON_SECRET` comparado com `!==` — **corrigido**

`src/app/api/cron/booking-reminders/route.ts:18-25`

`!==` é vulnerável a timing attack. **Fix**: helper `safeEqual` usando
`crypto.timingSafeEqual`. Mesma função foi reusada no webhook da Evolution.

### MÉDIO-3 — Webhook Evolution aceitava qualquer request — **corrigido**

`src/app/api/webhooks/evolution/route.ts`

Endpoint sem autenticação aceitava qualquer POST. Body inteiro era logado.

**Fix**:
- Nova env `EVOLUTION_WEBHOOK_SECRET`. Em produção, sem ela, retorna 503.
- Em dev, aceita sem segredo pra facilitar testes.
- Segredo aceito via header (`x-webhook-secret`) ou query (`?token=`).
- Comparação com `safeEqual`.
- Log estruturado sem corpo/PII (só `event`, `instance`, `at`).

### MÉDIO-4 — Cookie `rj_unit` sem flag `Secure` — **corrigido**

`src/app/(panel)/painel/unidades/actions.ts:41-47`

**Fix**: `secure: process.env.NODE_ENV === "production"` adicionado ao set.

### MÉDIO-5 — Headers de segurança HTTP ausentes — **corrigido**

`next.config.ts` estava vazio.

**Fix**: `headers()` configurado com CSP, X-Frame-Options DENY, X-Content-Type-Options
nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy
restrita (camera/microphone/geolocation/payment), HSTS 2 anos com preload.

**Observação sobre CSP**: usa `'unsafe-inline'` e `'unsafe-eval'` em
`script-src` por necessidade do Next App Router sem nonce-based CSP setup.
Pra hardening adicional, implementar nonce via middleware (`proxy.ts`).

### MÉDIO-6 — User enumeration no cadastro — **corrigido**

`src/server/onboarding/register.ts:40-46`

Resposta indicava explicitamente quando email já existia (`EMAIL_TAKEN`
mapeado pro campo `email` da UI).

**Fix**:
- Removida a checagem pré-insert. Email duplicado vira `23505` no INSERT.
- A action `registerAction` retorna mensagem genérica ("Não foi possível
  concluir o cadastro. Se você já tem conta, verifique seu e-mail.") sem
  destacar o campo email.
- Email "tentativa de cadastro" é disparado pro endereço informado, dando
  feedback útil ao dono legítimo da conta sem revelar o fato ao atacante.

### MÉDIO-7 — Timing attack no login (user vs senha errada) — **corrigido**

`src/lib/auth.ts:21-27`

`bcrypt.compare` era pulado quando usuário não existia.

**Fix**: constante `DUMMY_HASH` é comparada quando user não é encontrado, pra
igualar a latência (~100ms do bcrypt).

### MÉDIO-8 — `clientPhone` em endpoint público — **corrigido**

`src/app/api/bookings/[token]/route.ts:9-22`

`GET /api/bookings/[token]` retornava `clientPhone`. `publicToken` é
unguessable, mas o vazamento de PII sem necessidade vai contra LGPD.

**Fix**: `clientPhone` removido do `select`. A página pública
`(public)/[slug]/b/[token]/page.tsx` já não mostrava telefone (só nome) — sem
regressão de UI.

---

## BAIXO / INFO

### BAIXO-1 — bcrypt rounds 10 → 12 — **corrigido**

Atualizado em: `src/lib/auth.ts` (DUMMY_HASH gerado com 12), `register.ts`,
`password-reset.ts`, `team/mutations.ts`, `admin/_actions.ts`,
`trocar-senha/actions.ts`. Latência adicional ~300ms por hash.

### BAIXO-2 — `.env.example` com `AUTH_SECRET="change-me-in-prod"` — **corrigido**

Substituído por string vazia + comentário instruindo
`openssl rand -base64 32`. Reduz risco de cópia descuidada.

### BAIXO-3 — Cookie de sessão NextAuth sem `Secure` explícito — **corrigido**

`src/lib/auth.ts`

`cookies.sessionToken.options` definido com `httpOnly: true`, `sameSite: lax`,
`secure: production-only`, `path: /`.

### BAIXO-4 — Webhook Evolution logava body inteiro — **corrigido**

Junto com MÉDIO-3. Log agora é estruturado sem PII.

### BAIXO-5 — Impersonation só via `console.log` — **corrigido**

`src/app/(admin)/admin/_actions.ts`

**Fix** (envolveu migration nova): nova tabela `AuditLog` (id, actorId,
targetUserId, action, metadata JSON, createdAt). `impersonateUserAction` e
`stopImpersonatingAction` escrevem entradas `IMPERSONATE_START` e
`IMPERSONATE_STOP`. A tabela tem 3 índices pra consulta rápida (por actor,
por action, por target).

Eventos futuros que valem auditoria: `ORG_STATUS_CHANGE`, `USER_ROLE_CHANGE`,
`PASSWORD_RESET_BY_ADMIN`, `MEMBERSHIP_REMOVED`. Não foram implementados nesta
rodada — adicionar conforme necessário.

### BAIXO-6 — Validação UUID em `professionalId` — **pendente**

`src/server/booking/availability.ts`

O agente sugeriu `z.string().uuid()`, mas os IDs do projeto são **CUID** (não
UUID). O fix correto seria `z.string().cuid()`. Impacto é baixo (ID
malformado retorna lista vazia silenciosamente, não vaza dados de outro
tenant). Deixado pra depois pra não introduzir regressão.

### BAIXO-7 — URL fields aceitavam `data:`/`javascript:` — **corrigido**

`src/lib/validations/establishment.ts`, `src/lib/validations/professional.ts`

`logoUrl`, `coverUrl`, `photoUrl` agora exigem protocolo `https:` via `refine`.
Combinado com CSP `img-src 'self' https: data: blob:` (que ainda aceita
`data:` em imgs do próprio app — necessário pra placeholders).

### BAIXO-8 — `vercel.json` ausente pro cron — **deliberadamente pendente**

O `vercel.json` foi removido propositalmente no commit `8aff4b6`. O endpoint
`/api/cron/booking-reminders` está protegido por `CRON_SECRET` + agora
`timingSafeEqual`, mas não é disparado por nenhum scheduler. Recriar quando
o cron de lembretes for ligado em produção:

```json
{ "crons": [{ "path": "/api/cron/booking-reminders", "schedule": "*/5 * * * *" }] }
```

---

## Itens verificados e aprovados (sem fix necessário)

- `Booking.publicToken`: gerado com `crypto.randomBytes(24).toString("base64url")`.
- `PasswordResetToken`: 32 bytes random, hash SHA-256 no DB, TTL 60min, uso único,
  invalidação de outros pendentes na confirmação.
- HIBP: k-anonymity (SHA-1 primeiros 5 hex), fail-open com timeout 3s.
- Tenant isolation: nenhum IDOR encontrado. `getApiOwnerContext()` deriva
  `establishmentId` da sessão, nunca de input do usuário.
- Server actions: todas com `"use server"` chamam guard apropriado antes de
  qualquer dado.
- `MembershipUnit` ACL: aplicado corretamente em guards.
- STAFF gating: `requireOwnerRole()` bloqueia adequadamente.
- Impersonation: só ADMIN inicia; cookie `httpOnly`, 2h TTL; banner visível;
  agora com `AuditLog` persistente.
- SQL injection: zero uso de `$queryRawUnsafe`. Todas as queries vão pelo
  Prisma com parâmetros tipados.
- XSS: zero `dangerouslySetInnerHTML`. Conteúdo de usuário renderizado como
  texto React (escaping automático).
- CSRF: server actions do Next têm proteção built-in (verificação de Origin +
  cookie SameSite).
- `.env` no `.gitignore`: confirmado, não está commitado.
- Slug imutável: nenhuma action permite alterar slug pós-cadastro.
- Redirect targets: todos hardcoded em server actions (`/painel`, `/admin` etc.),
  exceto o caso do login-form coberto em ALTO-1.

---

## Arquivos novos

- `src/lib/rate-limit.ts` — sliding window in-memory
- `src/app/(auth)/trocar-senha/page.tsx`
- `src/app/(auth)/trocar-senha/change-password-form.tsx`
- `src/app/(auth)/trocar-senha/actions.ts`
- `prisma/migrations/20260521150000_audit_log_and_must_change_password/migration.sql`
- `docs/auditoria-seguranca.md` (este arquivo)

## Mudanças de schema

```diff
 model User {
+  mustChangePassword Boolean @default(false)
+  auditEvents        AuditLog[] @relation("AuditLogActor")
 }

+model AuditLog {
+  id           String   @id @default(cuid())
+  actorId      String
+  actor        User     @relation("AuditLogActor", fields: [actorId], references: [id], onDelete: Cascade)
+  targetUserId String?
+  action       String
+  metadata     Json?
+  createdAt    DateTime @default(now()) @db.Timestamptz(3)
+
+  @@index([actorId, createdAt])
+  @@index([action, createdAt])
+  @@index([targetUserId, createdAt])
+}
```

Migration aplicada em local. Em prod, roda automático no próximo `yarn build`
da Vercel (`prisma migrate deploy`).

## Variáveis novas de ambiente

- `EVOLUTION_WEBHOOK_SECRET` — segredo compartilhado para autenticar requests
  do webhook da Evolution. Em produção sem essa env, o endpoint retorna 503.

## Próximos passos sugeridos (hardening em camadas futuras)

1. Migrar rate limit pra Upstash Redis quando tiver volume — limites
   in-memory são por-instância na Vercel.
2. CSP nonce-based (eliminar `'unsafe-inline'` e `'unsafe-eval'` em
   script-src) via middleware no `proxy.ts`.
3. Auditar outros eventos sensíveis em `AuditLog`: mudança de role,
   suspensão/reativação de organização, reset de senha por admin, remoção
   de membro.
4. Considerar 2FA opcional (TOTP via app authenticator) para ADMIN.
5. Quando ligar o cron de lembretes em prod, recriar o `vercel.json` (BAIXO-8).
