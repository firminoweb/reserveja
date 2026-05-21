# Desenvolvimento & Deploy — passo a passo

Este é o manual operacional do Reserve Já. Cobre o ciclo completo:

1. [Setup inicial (uma vez por máquina)](#1-setup-inicial-uma-vez-por-máquina)
2. [Loop diário: editar → rodar → testar](#2-loop-diário-editar--rodar--testar)
3. [Mudando o banco: schema, migration e seed](#3-mudando-o-banco-schema-migration-e-seed)
4. [Commit & push](#4-commit--push)
5. [Deploy: como o código e o banco sobem juntos](#5-deploy-como-o-código-e-o-banco-sobem-juntos)
6. [Variáveis de ambiente na Vercel](#6-variáveis-de-ambiente-na-vercel)
7. [Como configurar o Neon (uma vez)](#7-como-configurar-o-neon-uma-vez)
8. [O que fazer quando algo dá errado](#8-o-que-fazer-quando-algo-dá-errado)
9. [Cheatsheet](#9-cheatsheet)

> **TL;DR do deploy**: `git push` na `main` → a Vercel roda `yarn build` → esse build
> roda `prisma migrate deploy` (aplica migrations pendentes no Neon) → roda `next build`.
> **Não tem passo manual de banco em produção.** Você só precisa garantir que as
> migrations estão commitadas junto com o código.

---

## 1. Setup inicial (uma vez por máquina)

**Pré-requisitos**:

- Node 20.9+ (testado em 22.x)
- Yarn 1.22 (`npm install -g yarn@1.22.22`)
- Docker + Docker Compose

**Clonar e instalar**:

```bash
git clone https://github.com/firminoweb/reserveja.git
cd reserveja
yarn install
```

**Variáveis de ambiente** (`.env` na raiz):

```bash
cp .env.example .env
```

Para dev local, os defaults funcionam. Gere um `AUTH_SECRET` decente:

```bash
openssl rand -base64 32
```

Cole o resultado em `AUTH_SECRET` no `.env`.

**Subir o banco e popular**:

```bash
yarn db:up          # sobe Postgres no Docker (porta 5432)
yarn db:migrate     # aplica migrations existentes — cria todas as tabelas
yarn db:seed        # popula dados de exemplo + constraint anti-overlap
```

**Rodar o app**:

```bash
yarn dev            # http://localhost:3000
```

Logins de teste:

| Email                  | Senha         | Role  |
| ---------------------- | ------------- | ----- |
| `admin@reserveja.app`  | `troca-isso`  | ADMIN |
| `joao@exemplo.com`     | `troca-isso`  | OWNER |

---

## 2. Loop diário: editar → rodar → testar

Em um terminal, deixe Postgres e dev rodando:

```bash
yarn db:up          # se não estiver rodando
yarn dev
```

Em outro terminal, antes de commitar:

```bash
yarn typecheck      # tsc --noEmit
yarn lint           # eslint
yarn build          # opcional — confirma que o build de produção também passa
```

> Se o `yarn build` falhar localmente, ele vai falhar na Vercel também. Rodar o
> build localmente antes de push é o jeito mais barato de pegar erros de tipo
> que só aparecem com tipos de rotas regenerados.

**Testar o app a sério** (não só ver compilando):

- Página pública: `http://localhost:3000/barbearia-do-joao`
- Fluxo completo: clique em "Agendar", siga os 3 passos.
- Painel: login com `joao@exemplo.com` → `/painel`.
- Admin: login com `admin@reserveja.app` → `/admin`.

Quando bateu algo estranho no banco em dev e você quer recomeçar do zero:

```bash
yarn db:reset       # APAGA tudo, recria, roda seed. Não use em prod, óbvio.
```

---

## 3. Mudando o banco: schema, migration e seed

Esse é o ponto que mais confunde — é por isso que o doc existe. O fluxo correto
para qualquer mudança no banco é:

### 3.1. Edite `prisma/schema.prisma`

Exemplo: adicionar um campo `birthday` em `User`:

```diff
 model User {
   id            String   @id @default(cuid())
   email         String   @unique
   passwordHash  String
   name          String
+  birthday      DateTime?
   ...
 }
```

### 3.2. Gere a migration

```bash
yarn db:migrate
```

O Prisma vai:

1. Comparar o `schema.prisma` com o estado atual do banco.
2. Pedir um **nome** para a migration (use snake_case, descritivo: `add_user_birthday`).
3. Criar um arquivo em `prisma/migrations/<timestamp>_<nome>/migration.sql`.
4. Aplicar a migration no seu Postgres local imediatamente.
5. Regerar o Prisma Client.

> **A pasta `prisma/migrations/` é versionada no git.** É ela que vai ser
> aplicada em produção. Sem essa pasta commitada, o banco de prod não muda.

### 3.3. (Opcional) Atualize o `prisma/seed.ts`

Se a mudança precisa de dados iniciais novos em dev (ex.: nova coluna com valor
calculado em registros existentes), edite `prisma/seed.ts` e rode:

```bash
yarn db:reset       # apaga + recria + roda seed atualizado
```

### 3.4. Operações que o Prisma sozinho NÃO faz

Se a mudança precisa de SQL bruto (constraint customizada, índice GIST, função
PL/pgSQL, etc.), você tem duas opções:

- **Editar manualmente o `migration.sql` recém-criado** antes de aplicar. Vale
  para alterações que o Prisma não consegue expressar no schema. Cuidado: se
  você já rodou `yarn db:migrate`, edite só se ainda não foi aplicada em
  nenhum ambiente — caso contrário, gere uma nova migration.

- **Usar `prisma/seed.ts`** (como já é feito hoje com a constraint EXCLUDE).
  O seed é idempotente e roda em todo `db:seed`. Em produção, o seed **não**
  roda automaticamente — então mudanças estruturais devem virar migration de
  verdade.

### 3.5. Checklist antes de commitar mudança de banco

- [ ] `prisma/schema.prisma` editado
- [ ] `yarn db:migrate` rodou e criou a pasta em `prisma/migrations/`
- [ ] `yarn typecheck` passa (o client foi regerado)
- [ ] Se mexeu em seed, `yarn db:reset` funcionou do zero
- [ ] **A pasta nova em `prisma/migrations/` está incluída no `git add`**

---

## 4. Commit & push

```bash
git status                                  # confirme o que vai entrar
git add -A                                  # ou liste arquivos específicos
git commit -m "feat: adiciona birthday em User"
git push origin main
```

Se você tem várias mudanças não relacionadas misturadas, **separe em commits**
diferentes (código x banco x docs). Facilita revisar e dá pra reverter pedaços
específicos.

> Convenção de commit: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`. O
> histórico atual segue isso.

---

## 5. Deploy: como o código e o banco sobem juntos

A Vercel está conectada ao repositório no GitHub. Todo push na `main` dispara um
build automático. **Você não precisa fazer nada manual** — é só dar push.

### O que acontece em cada deploy

Olha o `package.json`:

```json
"build": "prisma generate && prisma migrate deploy && next build"
```

A Vercel executa, em ordem:

1. **`prisma generate`** — gera o Prisma Client a partir do `schema.prisma`.
2. **`prisma migrate deploy`** — aplica no Neon **todas as migrations que estão
   em `prisma/migrations/` e ainda não foram aplicadas** naquele banco. O
   Prisma rastreia isso na tabela `_prisma_migrations`.
3. **`next build`** — builda o app.

Se a etapa 2 falhar (ex.: migration quebrada, conflito no banco), o deploy **inteiro**
falha. A Vercel mantém a versão anterior no ar e o banco fica no estado em que
estava. Você arruma e dá push de novo.

### Fluxo visual

```
você edita schema.prisma
        ↓
yarn db:migrate              ← cria pasta em prisma/migrations/
        ↓
git add prisma/ && commit
        ↓
git push origin main
        ↓
Vercel: yarn install
        ↓
Vercel: yarn build
   ├── prisma generate
   ├── prisma migrate deploy  ← aplica no Neon (produção)
   └── next build
        ↓
Vercel publica a nova versão
```

### Diferença entre `migrate dev` e `migrate deploy`

| Comando                  | Onde rodar | O que faz                                              |
| ------------------------ | ---------- | ------------------------------------------------------ |
| `prisma migrate dev`     | Só dev     | Compara schema, cria nova migration, aplica e regera client |
| `prisma migrate deploy`  | Prod & CI  | Aplica migrations já existentes. Não cria, não pergunta. |
| `prisma migrate reset`   | Só dev     | Apaga banco, recria, aplica migrations e roda seed     |
| `prisma db push`         | **Evitar** | Sincroniza schema sem criar migration — quebra histórico |

**Nunca use `prisma db push` neste projeto.** Sempre `migrate dev` em local e
deixe o `migrate deploy` rodar em produção via build.

### Sobre o seed em produção

O seed (`prisma/seed.ts`) **não roda em produção** automaticamente. Se você
precisa popular dados iniciais em prod uma vez (ex.: criar o primeiro usuário
admin), abra o painel do Neon, pegue a `DATABASE_URL` direct e rode local
apontando pra ela:

```bash
DATABASE_URL="postgresql://...neon.tech/..." yarn db:seed
```

Cuidado: rodar `db:seed` em prod **adiciona dados**. Não é destrutivo
(`db:reset` é). Releia o `prisma/seed.ts` antes de rodar — funções como
`upsert` são seguras, `create` cego pode duplicar.

---

## 6. Variáveis de ambiente na Vercel

No dashboard da Vercel → Settings → Environment Variables. Configure pra
**Production** (e também Preview se você quer previews funcionando):

| Nome                  | Origem                                       | Notas                                  |
| --------------------- | -------------------------------------------- | -------------------------------------- |
| `DATABASE_URL`        | Neon → connection string (direct, não pooled) | `?sslmode=require` é obrigatório       |
| `AUTH_SECRET`         | `openssl rand -base64 32`                    | Diferente do `.env` local              |
| `AUTH_URL`            | URL do app na Vercel                         | Ex.: `https://reserveja.vercel.app`    |
| `NEXT_PUBLIC_APP_URL` | Mesma URL pública                            | Aparece em metadados e links públicos  |
| `RESEND_API_KEY`      | Resend → API Keys                            | Sem isso, reset de senha não envia email |
| `RESEND_FROM_EMAIL`   | Ex.: `Reserve Já <no-reply@seu-dominio.com>` | Resend exige domínio verificado em prod |
| `CRON_SECRET`         | `openssl rand -base64 32`                    | Só se for ligar cron de lembretes      |
| `EVOLUTION_API_URL`   | (futuro)                                     | Pode ficar vazio por enquanto          |
| `EVOLUTION_API_KEY`   | (futuro)                                     | Pode ficar vazio por enquanto          |

> **Importante sobre `DATABASE_URL`**: use a **direct connection** do Neon
> (não a pooled). O `prisma migrate deploy` no build precisa de uma conexão
> direta. Em runtime serverless o adapter `pg` também funciona com a direct.
> Se um dia o app crescer e o número de conexões for problema, dá pra
> introduzir uma `DIRECT_URL` separada — mas isso não é necessário hoje.

Após adicionar/editar variáveis, **rodar um redeploy** (Settings → Deployments
→ Redeploy do último build), porque variáveis novas não entram em deploys já
construídos.

---

## 7. Como configurar o Neon (uma vez)

1. Crie projeto em <https://neon.tech>. Região mais próxima do Brasil:
   `us-east-1` ou `sa-east-1` se disponível.
2. Pegue a **connection string direct** (não a pooled). Formato:
   ```
   postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/reserveja?sslmode=require
   ```
3. Cole em `DATABASE_URL` na Vercel (Production + Preview).
4. Disparar um primeiro deploy: `git commit --allow-empty -m "chore: trigger initial deploy" && git push`.
5. No primeiro deploy, o build vai rodar `prisma migrate deploy` contra um banco
   vazio e criar todas as tabelas das migrations existentes.
6. **Para popular dados iniciais** (admin, primeira organização etc.), rode o
   seed apontando pra prod **a partir da sua máquina**:
   ```bash
   DATABASE_URL="postgresql://...neon.tech/..." yarn db:seed
   ```
   Faça isso **uma vez só**. Reler o `prisma/seed.ts` antes — você muito provavelmente
   vai querer mudar emails/senhas do admin antes de rodar em prod.

### Branching do Neon (bônus)

O Neon suporta criar branches do banco (igual git). Útil para previews da Vercel:

- Em Preview deploys, configure `DATABASE_URL` apontando pra um branch separado.
- Ou use a integração oficial Vercel ↔ Neon que cria branches automaticamente
  por PR. Não é obrigatório, mas evita que testes de preview poluam o banco de
  produção.

---

## 8. O que fazer quando algo dá errado

### "Build falhou na Vercel com erro do Prisma"

Vá no log do build na Vercel. Cenários comuns:

- **Migration falhou** (`prisma migrate deploy` retornou erro): geralmente é
  uma migration mal escrita (referência a coluna que não existe, etc.). Arrume
  o `.sql` localmente, teste com `yarn db:reset`, e dê push de novo.
- **Conflito de migration** (`P3009` ou similar): você fez merge de duas branches
  que criaram migrations com timestamps próximos e o estado divergiu. Solução
  segura: criar uma nova migration manual que reconcilia. Em projetos pequenos,
  também dá pra deletar a migration ruim, rodar `yarn db:reset` em dev pra
  gerar uma limpa, e rebasar — mas só se o banco de prod ainda não aplicou a
  ruim.
- **`DATABASE_URL` errado**: confirme nas env vars da Vercel. Tem que ter
  `?sslmode=require` no final.

### "Esqueci de criar a migration e dei push"

Sintoma: o código novo usa um campo que não existe no banco de prod. O deploy
até passa (porque não tinha migration nova para falhar), mas o app dá erro em
runtime.

Solução:

```bash
# localmente, com o schema novo já no arquivo
yarn db:migrate                # cria a migration
git add prisma/migrations/
git commit -m "fix: add missing migration for ..."
git push origin main
```

A próxima build aplica a migration no Neon e tudo volta ao normal.

### "Quero ver o banco de produção"

Pegue a connection string do Neon, exporte e abra o Studio:

```bash
DATABASE_URL="postgresql://...neon.tech/..." yarn db:studio
```

Cuidado redobrado — você está editando dados reais.

### "Preciso reverter uma migration aplicada em prod"

Prisma não tem `migrate down`. Você cria uma **nova** migration que desfaz a
anterior:

```bash
yarn db:migrate    # nome sugerido: revert_user_birthday
```

E edita o `.sql` manualmente com o `DROP COLUMN`/`ALTER TABLE` necessário.
Commita, dá push, deploy aplica. Dados perdidos não voltam — então backup
**antes** se a coluna tem informação importante.

### "Quero ver os últimos deploys / forçar redeploy"

Vercel dashboard → Deployments. Cada deploy tem um link "Redeploy". Útil
quando você só mudou env var e quer aplicar sem novo commit.

### "Postgres local não sobe"

```bash
docker ps                # confirma se o container está rodando
yarn db:down             # derruba
docker volume ls         # se o volume estiver corrompido, dá pra remover
yarn db:up               # sobe de novo
```

Se mesmo assim falhar, `docker logs reserveja-postgres` mostra o motivo.

---

## 9. Cheatsheet

### Dev local

```bash
yarn db:up                    # sobe Postgres
yarn dev                      # app em http://localhost:3000
yarn typecheck && yarn lint   # antes de commitar
yarn db:studio                # GUI do banco
yarn db:reset                 # zera + recria + seed (dev only)
```

### Mudou o banco

```bash
# 1. editar prisma/schema.prisma
yarn db:migrate               # nome: snake_case descritivo
# 2. testar
yarn typecheck
# 3. se mexeu em seed:
yarn db:reset
# 4. commitar TUDO (inclui prisma/migrations/)
git add -A && git commit -m "feat: ..."
git push origin main
```

### Deploy

```bash
git push origin main          # só isso. Vercel cuida do resto.
```

A Vercel:

1. `yarn install`
2. `yarn build` → `prisma generate` → `prisma migrate deploy` (aplica no Neon) → `next build`
3. Publica.

### Comandos que **nunca** rodar em produção sem necessidade absoluta

- `yarn db:reset` — apaga todos os dados.
- `prisma db push` — quebra o histórico de migrations.
- `prisma migrate reset` — mesmo que `db:reset`.
- `DROP TABLE ...` direto no Neon — use migration de verdade.

### Resumo de uma frase

> **Você nunca aplica migration manualmente em produção neste projeto.** Você
> commita as migrations junto com o código, dá `git push`, e o `build` da
> Vercel aplica antes de buildar o Next. Se o banco está fora de sincronia,
> é porque alguma migration está faltando no repo — não porque você esqueceu
> de "subir o banco".
