# Reserve Já

Sistema de agendamentos para salões, barbearias, mecânicos e outros prestadores
de serviço. Cliente agenda em 3 cliques pelo link/QR-code do estabelecimento —
sem app, sem cadastro. O dono gerencia tudo num painel simples.

## Stack

- **Next.js 16** (App Router, Turbopack, React 19.2)
- **TypeScript** estrito
- **Tailwind v4** + **shadcn/ui** (preset radix-vega)
- **Prisma 7** + **PostgreSQL 16**
- **NextAuth v5** (beta, Auth.js) com Credentials provider
- **Zod** + **React Hook Form**
- **TanStack Query** (cache cliente)
- **date-fns** + **date-fns-tz** (timezone-aware)
- **Evolution API** (WhatsApp, integração futura)
- **Yarn** 1.22

## Arquitetura

```
src/
├── app/
│   ├── (public)/        Landing, vitrine do salão e fluxo de agendamento
│   ├── (panel)/         Painel do estabelecimento (dono/staff)
│   ├── (admin)/         Super-admin (você e sócios)
│   ├── (auth)/          Login e cadastro
│   ├── api/             Route Handlers (REST)
│   ├── manifest.ts      PWA manifest
│   └── providers.tsx    QueryClient + SessionProvider
├── components/
│   ├── ui/              shadcn/ui (radix)
│   └── …                booking, panel, marketing
├── lib/                 db, auth, time, whatsapp, validações (Zod)
├── server/              lógica de domínio (booking, auth guards…)
├── types/               extensões de tipos (next-auth)
└── proxy.ts             Next 16: antigo `middleware.ts`

prisma/
├── schema.prisma
└── seed.ts
```

A camada `server/` fica entre as rotas HTTP e o Prisma. Isso permite extrair
para um serviço NestJS separado no futuro sem reescrever a lógica.

## Setup

### 1. Pré-requisitos

- Node 20.9+ (testado em 22.x)
- Yarn 1.22
- Docker + Docker Compose (para Postgres local)

### 2. Instalação

```bash
yarn install
cp .env.example .env
```

Edite `.env` se precisar — os valores default funcionam pra dev local.
Gere um `AUTH_SECRET` decente:

```bash
openssl rand -base64 32
```

### 3. Banco

```bash
yarn db:up           # sobe Postgres no Docker
yarn db:migrate      # aplica migrations (cria as tabelas)
yarn db:seed         # popula com dados de exemplo + constraint anti-overlap
```

O seed cria:
- **admin@reserveja.app** / `troca-isso` — super admin
- **joao@exemplo.com** / `troca-isso` — dono da Barbearia do João
- Estabelecimento `/barbearia-do-joao` com 2 serviços e 2 profissionais

### 4. Dev

```bash
yarn dev
```

Abra <http://localhost:3000>.

## Rotas-chave

| URL                                | O quê                          |
| ---------------------------------- | ------------------------------ |
| `/`                                | Landing                        |
| `/barbearia-do-joao`               | Vitrine pública do salão       |
| `/barbearia-do-joao/agendar`       | Fluxo de agendamento (3 passos)|
| `/barbearia-do-joao/b/<token>`     | Página do cliente p/ ver/cancelar |
| `/login`                           | Login                          |
| `/painel`                          | Agenda do dia (dono)           |
| `/admin`                           | Super-admin                    |

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
```

Endpoints administrativos (`POST /api/establishments`, CRUD de services/professionals)
estão como stubs `501 Not Implemented` aguardando a próxima fase.

## Notas técnicas

### Anti-double-booking

O `seed.ts` aplica uma constraint Postgres em `Booking`:

```sql
EXCLUDE USING gist (
  "professionalId" WITH =,
  tstzrange("startsAt", "endsAt") WITH &&
) WHERE (status IN ('PENDING', 'CONFIRMED'))
```

Isso impede sobreposição entre dois bookings ativos do mesmo profissional no
nível do banco — funciona mesmo com requests simultâneas. O handler
`createBooking` captura o erro `23P01` (`exclusion_violation`) e retorna 409.

### Next.js 16 — diferenças relevantes

- `middleware.ts` foi renomeado para **`proxy.ts`** (função `proxy`, runtime nodejs only)
- `params` e `searchParams` são **Promises** — sempre `await` ou `use()`
- Helpers globais `PageProps<'/route/[slug]'>` e `RouteContext<'/api/[id]'>`
- `next lint` removido — use ESLint direto

### PWA

`app/manifest.ts` está configurado, ícone em `public/icon.svg`. Service worker
não foi adicionado ainda — `next-pwa` não tem suporte oficial pro Next 16.
Adicionar quando precisar de offline/push reliable.

## Scripts úteis

```bash
yarn typecheck       # tsc --noEmit
yarn lint            # eslint
yarn db:studio       # Prisma Studio (GUI do banco)
yarn db:reset        # apaga + recria + roda seed
```

## Roadmap (curto prazo)

- [ ] UI real dos 3 passos de agendamento (consumindo `/api/availability`)
- [ ] CRUD funcional de serviços, profissionais e horários no painel
- [ ] Onboarding self-service em `/cadastro`
- [ ] Integração com Evolution API (confirmação + lembrete 1h antes)
- [ ] Página marketing detalhada (hero, pricing, FAQ)
- [ ] Testes (Vitest + Playwright)
# reserveja
