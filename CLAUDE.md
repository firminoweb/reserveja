@AGENTS.md

# Reserve Já — guia do agente

Sistema de agendamentos (salões, barbearias, mecânicos etc.). Cliente agenda
por link público sem app/cadastro; dono gerencia em painel. Stack unificada
em Next.js (público + painel + admin no mesmo app).

## Stack — versões importam, não atualize sem motivo

- **Next.js 16.2** — App Router, Turbopack default, RSC, React 19.2
- **Prisma 7** — mudou config + precisa adapter (ver gotchas)
- **NextAuth v5 beta** (Auth.js) — Credentials provider + JWT
- **Tailwind v4** + **shadcn/ui** preset `vega` (base **`radix-ui`** umbrella, NÃO `@base-ui/react`)
- **Yarn 1.22 classic** (não npm, não pnpm)
- **Postgres 16** via Docker Compose
- TS estrito, ESLint flat config

## Gotchas que vão te morder

### Next 16 (breaking vs 15)
- Antigo `middleware.ts` agora é **`src/proxy.ts`** com `export function proxy(req)`. Runtime é nodejs (não edge).
- `params` e `searchParams` em pages/routes/layouts são **`Promise`** — sempre `await`. Use os helpers globais `PageProps<'/route/[slug]'>`, `RouteContext<'/api/[id]'>`, `LayoutProps<'/...'>`.
- `next lint` não existe — `yarn lint` chama `eslint` direto.
- Browser extensions (ColorZilla, MetaMask, etc.) injetam attrs no `<body>` causando hydration mismatch. `<body suppressHydrationWarning>` em `app/layout.tsx` já trata.
- Antes de chutar API do Next, leia `node_modules/next/dist/docs/01-app/` — convenções mudaram bastante.
- **React Compiler**: nunca `form.watch()` (lint `react-hooks/incompatible-library`) — use `useWatch({ control, name })`. Nunca setState síncrono em `useEffect` (`react-hooks/set-state-in-effect`) — derive com `useMemo`, setState só pra resultado async.
- **Tipos de rotas novas**: `RouteContext<"/api/...">` e `PageProps<"/...">` são gerados só no build. Em rota recém-criada, typecheck falha. Use tipo inline `{ params: Promise<{ id: string }> }` até o próximo build regenerar.

### Prisma 7
- URL **NÃO vai mais no `schema.prisma`** — fica em `prisma.config.ts` (que precisa `import "dotenv/config"` no topo, senão `env()` não acha nada).
- Client precisa adapter explícito: `new PrismaClient({ adapter: new PrismaPg({ connectionString: ... }) })`. Ver `src/lib/db.ts` e `prisma/seed.ts`.
- Campos `DateTime` por default viram `timestamp without time zone`. Pra usar `tstzrange` em constraint (imutável requirement), precisa `@db.Timestamptz(3)` no schema. Já aplicado em `Booking` e `TimeBlock` em `startsAt`, `endsAt`, `cancelledAt`, `createdAt`, `updatedAt`.

### Shadcn vega
- Componentes importam de `radix-ui` (umbrella package), **não** `@radix-ui/react-*`. Padrão: `import { Slot } from "radix-ui"` → use `<Slot.Root>`.
- `form` component não veio do registry — está escrito à mão em `src/components/ui/form.tsx`.
- `calendar.tsx` teve a entrada `table:` removida (incompat com `react-day-picker` v10).
- Preset `nova` (default do shadcn) usa `@base-ui/react` e não tem todos os componentes — **não troque**.

### NextAuth v5 server actions
- `signIn("credentials", { redirectTo })` joga `NEXT_REDIRECT`. Padrão: `try { await signIn(...) } catch (e) { if (e instanceof AuthError) return {ok:false,...}; throw e }`.
- Augmentation de tipos vive em `src/types/next-auth.d.ts` (User + Session + JWT com `role: Role`).

### Postgres EXCLUDE / idempotência
- `EXCEPTION WHEN duplicate_object` NÃO captura constraint EXCLUDE existente (Postgres solta `42P07 duplicate_table` por causa do índice subjacente). Padrão idempotente: `IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '...')` antes do `ALTER TABLE`. Já aplicado em `prisma/seed.ts`.

## Estrutura

```
src/
  app/
    (public)/        Landing + vitrine + fluxo de agendamento (3 passos)
    (panel)/         Dono/staff — layout chama requireOwnerMembership()
    (admin)/         Super-admin — layout chama requireRole("ADMIN")
    (auth)/          Login / cadastro
    api/             REST handlers — só validam (Zod) e chamam server/
    manifest.ts      PWA
    providers.tsx    QueryClient + SessionProvider
  components/
    ui/              shadcn (radix)
    booking/         Stepper, ServiceCard, SlotPicker, BookingForm, CancelBookingButton
  lib/               db, auth, time, whatsapp, query-client, validations/ (Zod)
  server/            Lógica de domínio (booking/, auth/guards.ts) — isolada das rotas
  proxy.ts           Checagem básica de sessão em /painel e /admin (matcher config)
prisma/
  schema.prisma     (datasource sem url, ver prisma.config.ts)
  seed.ts           (aplica também a constraint EXCLUDE — idempotente)
  migrations/       (Prisma maneja)
```

**Convenção**: lógica de domínio fica em `src/server/`. Route Handlers (`src/app/api/`) só fazem parse de query/body (Zod) e chamam funções de `server/`. Mantém portável pra extrair pra NestJS depois.

## Decisões fixas — não revisitar sem motivo claro

- **API**: Route Handlers do Next, não NestJS separado. 1 repo, tipos end-to-end.
- **State entre passos do agendamento**: URL query params (`?serviceId&professionalId&startsAt`). Sem context/zustand.
- **Timezone**: tudo UTC no DB. Conversão na UI/availability usa `establishment.timezone`. Helpers em `src/lib/time.ts`.
- **Anti-double-booking**: constraint Postgres `booking_no_overlap_per_professional` com `EXCLUDE USING gist`. `createBooking` em `server/booking/create.ts` captura código SQLSTATE `23P01` e lança `BookingError("SLOT_TAKEN")` → handler retorna 409.
- **Booking.publicToken**: `crypto.randomBytes(24).toString("base64url")` (não cuid — token precisa ser unguessable; cuid é time-ordered).
- **Auth**: NextAuth v5 Credentials + JWT, sem PrismaAdapter (não é necessário pra Credentials).
- **Multi-tenancy**: por path (`/[slug]/...`). Sem subdomínio por enquanto.
- **PWA**: só `manifest.ts`. Sem service worker — `next-pwa` não tem suporte estável pro Next 16.
- **Hierarquia**: `Organization` (empresa — name, category, taxId, status, planLimits) → 1+ `Establishment` (unidade — slug público, services/professionals/working hours/blocks/bookings). `Membership` liga User à Organization. **Per-unit ACL**: tabela `MembershipUnit` — sem linhas pra uma membership = acesso total; com linhas = restrito às unidades listadas.
- **Unidade atual no painel**: cookie `rj_unit` (constante `UNIT_COOKIE` em guards). `requireOwnerMembership()` retorna `{ organization, establishment, establishments, role }` — `establishment` é a selecionada (ou primeira allowed). Trocar via `setSelectedUnitAction(unitId)`. Página `/painel/unidades` lista + cria nova (respeita `planLimitUnits`).
- **Slug não é editável** após cadastro (link público quebraria). Edição precisaria redirect slug-antigo→novo — fora do MVP.
- **Upload de mídia**: só URL pública por enquanto (cliente cola Cloudinary/Imgur/S3). Real upload exige decisão de storage (Vercel Blob é o caminho natural).
- **Cron de lembretes**: endpoint `/api/cron/booking-reminders` protegido por `CRON_SECRET` (Bearer header ou `?key=` query). Agendador externo: **cron-job.org** chama a cada 5min (não usamos Vercel Cron — Hobby não suporta sub-diário). Idempotência via `Booking.reminderSentAt`.

## Comandos

```bash
# Banco
yarn db:up         # docker compose up -d postgres
yarn db:migrate    # prisma migrate dev
yarn db:seed       # popula + cria constraint EXCLUDE (idempotente)
yarn db:reset      # apaga + recria + seed
yarn db:studio     # GUI

# Dev / build
# yarn dev — USUÁRIO RODA EM OUTRO TERMINAL. Não tente subir dev daqui.
yarn typecheck     # tsc --noEmit
yarn lint          # eslint
yarn build         # produção (turbopack)
```

## Dados do seed

| Email | Senha | Role | Onde |
|---|---|---|---|
| `admin@reserveja.app` | `troca-isso` | ADMIN | `/admin` |
| `joao@exemplo.com` | `troca-isso` | OWNER | `/painel` |

Estabelecimento: `barbearia-do-joao` em `/barbearia-do-joao`.
Serviços: Corte (R$50, 30min), Barba (R$40, 30min).
Profissionais: Carlos (Corte+Barba), Marcos (só Corte).
Horário: seg-sáb 9h–19h, fuso America/Sao_Paulo.

## Padrões esperados ao escrever código

- **Form client**: RHF + `zodResolver` + componente `<Form>` do shadcn. Ver `src/components/booking/booking-form.tsx`.
- **Mutation**: `fetch()` direto + `toast` do sonner pra feedback + `router.push/refresh`. Ainda sem mutations de TanStack Query (pode adicionar quando precisar de cache invalidation complexa).
- **Auth guard em página/layout**: importar de `src/server/auth/guards.ts` (`requireSession`, `requireRole`, `requireOwnerMembership`).
- **Datas em server components**: `formatLocal(date, establishment.timezone, pattern)` de `src/lib/time.ts`.
- **Validação**: schemas em `src/lib/validations/` — reusar entre client (RHF resolver) e server (route handler).
- **Não criar arquivos novos sem necessidade** — verificar se já existe em `components/`, `lib/`, `server/`.
- **Zod**: sempre `import { z } from "@/lib/zod"` (ativa locale pt-BR). Nunca direto de `"zod"`.
- **API guard do painel**: `const ctx = await getApiOwnerContext(); if (ctx instanceof NextResponse) return ctx` — retorna `{ userId, organizationId, establishmentId }` ou resposta de erro pronta. Page-level usa `requireOwnerMembership()` que devolve `{ session, organization, establishment, establishments, role }`. Pra páginas owner-only, use `requireOwnerRole()` que redireciona STAFF pra `/painel`.
- **Side effect pós-resposta**: notificação, log externo etc. ficam em `after(() => fn())` de `next/server`. Erros nunca propagam pro client.
- **Moeda**: `<MoneyInput value={cents} onChange={setCents} />` de `@/components/ui/money-input`. Armazenar sempre em centavos (inteiro), nunca float.
- **Telefone BR**: helpers em `@/lib/phone` (`maskBR` no onChange, `formatNationalBR` na carga, `isValidBR` em refines do Zod, `toE164BR` pra persistir). Não use `libphonenumber-js` direto — o ESM dele está quebrado na 1.13.2.
- **Slug**: form de cadastro tem check ao vivo via `GET /api/establishments/check-slug?slug=...`. Slug duplicado = `RegisterError("SLUG_TAKEN")`, nunca mutação silenciosa.
- **CPF/CNPJ**: helpers em `@/lib/tax` (`maskTaxId`, `isValidTaxId`, `taxIdDigits`). Tax id mora em `Organization.taxId` (só dígitos). Nunca em User.
- **Categoria de negócio**: enum `BusinessCategory` em `Organization.category`. Labels pt-BR em `@/lib/business-categories.ts`.
- **Força de senha**: `<PasswordStrength password={pw} />` de `@/components/ui/password-strength`. Feedback visual, não bloqueia submit. Mínimo 8 char é regra dura no Zod.
- **HIBP**: `isPasswordLeaked(pw)` em `@/lib/hibp` — k-anonymity (SHA-1, primeiros 5 hex), fail-open com timeout de 3s. Já plugado em `registerOwner` e `confirmPasswordReset`. Erro vira `PASSWORD_LEAKED` mapeado pro campo `password`.
- **Identidade visual**: documentada em `DESIGN.md`. Paleta indigo, Poppins, botões/inputs com 44px+ de altura. Não invente cor/tamanho fora do sistema.
- **Equipe**: `/painel/equipe` (owner-only). Cria User+Membership+MembershipUnit em transação via `inviteMember()`. Se user é novo, gera senha temp via `randomBytes` em alfabeto seguro (sem `O0l1`) e envia por email (Resend, fail-open). Owner vê a senha na tela pra compartilhar via outro canal.
- **STAFF gating**: nav itens com `ownerOnly: true` somem pra STAFF. Páginas owner-only: equipe, configurações (futuramente). Acesso por unidade: `MembershipUnit` rows — sem rows = todas as unidades; com rows = só as listadas. Guard `requireOwnerMembership()` já aplica.
- **Override de horário por profissional**: `ProfessionalSchedule` rows. Form de profissional tem toggle "Horário personalizado". Sem rows = segue WorkingHour do estabelecimento. Com rows = substitui inteiramente.
