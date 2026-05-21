# Reserve Já

Sistema de agendamentos para salões, barbearias, mecânicos, estética e
outros prestadores de serviço. Cliente agenda em 3 cliques pelo link/QR-code
do estabelecimento — sem app, sem cadastro. O dono gerencia tudo num painel
simples; o super-admin gerencia tudo num painel ainda mais simples.

> **Quer só editar, rodar e subir?** Vá direto para
> [`docs/desenvolvimento-e-deploy.md`](docs/desenvolvimento-e-deploy.md).
> Esse README é o panorama; o doc de deploy é o manual.

## Stack

- **Next.js 16** (App Router, Turbopack, React 19.2) — público + painel + admin no mesmo app
- **TypeScript** estrito + **ESLint** flat config
- **Tailwind v4** + **shadcn/ui** (preset radix-vega)
- **Prisma 7** + **PostgreSQL 16** (Docker em dev, **Neon** em prod)
- **NextAuth v5** beta (Auth.js) com Credentials provider + JWT
- **Zod** (com locale pt-BR) + **React Hook Form**
- **TanStack Query** (cache cliente)
- **date-fns** + **date-fns-tz** (timezone-aware: UTC no banco, conversão na UI)
- **Resend** (email transacional) + **Evolution API** (WhatsApp, futuro)
- **Hospedagem**: **Vercel** (app) + **Neon** (Postgres)
- **Yarn** 1.22 (não npm, não pnpm)

## Hierarquia de dados

```
Organization (empresa/marca)
 ├── Establishment (unidade/filial)   ← slug público, services, professionals, bookings
 │    ├── WorkingHour
 │    ├── Service
 │    ├── Professional ── ProfessionalSchedule (override de horário)
 │    │                └─ ProfessionalService
 │    ├── TimeBlock (feriado, almoço, folga)
 │    └── Booking (status, publicToken para link do cliente)
 └── Membership (usuário ↔ organização)
      └── MembershipUnit (ACL por unidade — vazio = acesso total)
```

- **Per-unit ACL**: sem linhas em `MembershipUnit` = acesso a todas as unidades; com linhas = restrito.
- **Unidade ativa no painel**: cookie `rj_unit` (constante `UNIT_COOKIE` em `src/server/auth/guards.ts`).
- **Roles**: `ADMIN` (super-admin do produto), `OWNER` (dono da org), `STAFF` (funcionário com acesso restrito).

## Arquitetura de código

```
src/
├── app/
│   ├── (public)/        Landing, vitrine do estabelecimento e fluxo de agendamento
│   ├── (panel)/         Painel do estabelecimento (dono/staff)
│   ├── (admin)/         Super-admin
│   ├── (auth)/          Login, cadastro e reset de senha
│   ├── api/             Route Handlers (REST)
│   ├── manifest.ts      PWA manifest
│   └── providers.tsx    QueryClient + SessionProvider
├── components/
│   ├── ui/              shadcn/ui (radix)
│   ├── booking/         Stepper, ServiceCard, SlotPicker, BookingForm
│   ├── panel/           Agenda, clientes, histórico
│   ├── admin/           Listas e formulários do super-admin
│   └── site/            Header, footer, marketing
├── lib/                 db, auth, time, phone, tax, hibp, validations/ (Zod)
├── server/              Lógica de domínio (booking/, auth/guards.ts, admin/, team/…)
├── types/               Extensões de tipos (next-auth)
└── proxy.ts             Next 16: o antigo `middleware.ts`

prisma/
├── schema.prisma
├── migrations/          ← versionadas no git, aplicadas em prod pelo build
└── seed.ts              ← popula dev + aplica constraint EXCLUDE (idempotente)

docs/
└── desenvolvimento-e-deploy.md   ← passo a passo de edição, teste, banco e deploy
```

**Convenção**: lógica de domínio fica em `src/server/`. Route Handlers (`src/app/api/`)
só validam input (Zod) e chamam funções de `server/`. Mantém portável para extrair
para um serviço NestJS no futuro sem reescrever a lógica.

## Setup local (TL;DR)

```bash
yarn install
cp .env.example .env          # edite se necessário; defaults funcionam pra dev
yarn db:up                    # sobe Postgres no Docker
yarn db:migrate               # aplica migrations
yarn db:seed                  # popula dados de exemplo + constraint anti-overlap
yarn dev                      # http://localhost:3000
```

Conta de teste após o seed:

| Email                  | Senha         | Role  | Onde     |
| ---------------------- | ------------- | ----- | -------- |
| `admin@reserveja.app`  | `troca-isso`  | ADMIN | `/admin` |
| `joao@exemplo.com`     | `troca-isso`  | OWNER | `/painel` |

Estabelecimento de exemplo: **Barbearia do João** em `/barbearia-do-joao`.

> **Detalhes, comandos do dia a dia e como subir o banco em produção**:
> [`docs/desenvolvimento-e-deploy.md`](docs/desenvolvimento-e-deploy.md).

## Rotas-chave

| URL                                | O quê                                 |
| ---------------------------------- | ------------------------------------- |
| `/`                                | Landing                               |
| `/cadastro`                        | Onboarding self-service               |
| `/login`                           | Login                                 |
| `/barbearia-do-joao`               | Vitrine pública do estabelecimento    |
| `/barbearia-do-joao/agendar`       | Fluxo de agendamento (3 passos)       |
| `/barbearia-do-joao/b/<token>`     | Página do cliente p/ ver/cancelar     |
| `/painel`                          | Agenda do dia (dono/staff)            |
| `/painel/clientes`                 | Base de clientes                      |
| `/painel/historico`                | Histórico de agendamentos             |
| `/painel/equipe`                   | Convidar/gerenciar staff (owner-only) |
| `/painel/unidades`                 | Criar/trocar unidades (owner-only)    |
| `/admin`                           | Super-admin                           |

## API (REST)

```
GET    /api/establishments/[slug]
GET    /api/establishments/[slug]/services
GET    /api/establishments/[slug]/professionals?serviceId=
GET    /api/availability?establishmentSlug=&serviceId=&professionalId?=&date=YYYY-MM-DD
POST   /api/bookings
GET    /api/bookings/[token]
PATCH  /api/bookings/[token]/cancel
POST   /api/webhooks/evolution
GET    /api/cron/booking-reminders        (protegido por CRON_SECRET)
```

## Notas técnicas relevantes

### Anti-double-booking (constraint Postgres)

O `seed.ts` aplica uma `EXCLUDE USING gist` em `Booking`:

```sql
EXCLUDE USING gist (
  "professionalId" WITH =,
  tstzrange("startsAt", "endsAt") WITH &&
) WHERE (status IN ('PENDING', 'CONFIRMED'))
```

Impede sobreposição entre dois bookings ativos do mesmo profissional no
nível do banco — funciona mesmo com requests simultâneas. `createBooking` em
`src/server/booking/create.ts` captura o SQLSTATE `23P01` (exclusion_violation)
e responde 409.

### Next.js 16 — diferenças vs Next 15

- `middleware.ts` foi renomeado para **`proxy.ts`** (função `proxy`, runtime nodejs only).
- `params` e `searchParams` em pages/routes/layouts são **Promises** — sempre `await`.
- Helpers globais: `PageProps<'/route/[slug]'>`, `RouteContext<'/api/[id]'>`, `LayoutProps<'/...'>`.
- `next lint` removido — use `eslint` direto (`yarn lint`).

### Prisma 7 — diferenças vs Prisma 6

- `url` **não vai mais** no `schema.prisma`, fica em `prisma.config.ts` (que precisa `import "dotenv/config"`).
- Client precisa adapter explícito: `new PrismaClient({ adapter: new PrismaPg(...) })`.
- `DateTime` sem anotação vira `timestamp without time zone`. Para colunas usadas em `tstzrange` (constraint EXCLUDE) é obrigatório `@db.Timestamptz(3)`.

### PWA

`app/manifest.ts` configurado, ícone em `public/icon.svg`. Sem service worker
por enquanto — `next-pwa` não tem suporte oficial pro Next 16.

## Comandos úteis

```bash
yarn dev           # dev server
yarn build         # gera client Prisma, aplica migrations, builda Next
yarn typecheck     # tsc --noEmit
yarn lint          # eslint

yarn db:up         # sobe Postgres local
yarn db:down       # derruba
yarn db:migrate    # cria/aplica migration em dev (pede nome)
yarn db:seed       # popula dev
yarn db:reset      # apaga, recria, roda seed (CUIDADO: destrutivo)
yarn db:studio     # GUI do banco
yarn db:generate   # regera o Prisma Client
```

## Identidade visual e padrões

Documentação de design em [`DESIGN.md`](DESIGN.md). Convenções de código,
guards e validações em [`CLAUDE.md`](CLAUDE.md) / [`AGENTS.md`](AGENTS.md).

## Roadmap (curto prazo)

- [ ] Integração com Evolution API (confirmação + lembrete 1h antes)
- [ ] Upload real de mídia (logo/cover) — provavelmente Vercel Blob
- [ ] Testes (Vitest + Playwright)
- [ ] Página de marketing detalhada (hero, pricing, FAQ)
