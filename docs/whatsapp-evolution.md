# WhatsApp via Evolution API — setup completo

Este doc te leva do **zero absoluto** (sem VPS, sem domínio) até o Reserve Já
mandando mensagens de WhatsApp de verdade.

## Sumário

1. [O que vai existir no final](#1-o-que-vai-existir-no-final)
2. [Decisões prévias e custos](#2-decisões-prévias-e-custos)
3. [Passo 1 — Registrar um domínio](#3-passo-1--registrar-um-domínio)
4. [Passo 2 — Contratar VPS](#4-passo-2--contratar-vps)
5. [Passo 3 — Apontar DNS do subdomínio](#5-passo-3--apontar-dns-do-subdomínio)
6. [Passo 4 — Preparar o servidor](#6-passo-4--preparar-o-servidor)
7. [Passo 5 — Subir Evolution API com Docker Compose](#7-passo-5--subir-evolution-api-com-docker-compose)
8. [Passo 6 — HTTPS automático com Caddy](#8-passo-6--https-automático-com-caddy)
9. [Passo 7 — Criar instance e escanear QR code](#9-passo-7--criar-instance-e-escanear-qr-code)
10. [Passo 8 — Configurar webhook na Evolution](#10-passo-8--configurar-webhook-na-evolution)
11. [Passo 9 — Plugar na Vercel](#11-passo-9--plugar-na-vercel)
12. [Passo 10 — Testar end-to-end](#12-passo-10--testar-end-to-end)
13. [Operação: backup, atualização, logs](#13-operação-backup-atualização-logs)
14. [Endurecimento: o que fazer antes de ir pra valer](#14-endurecimento-o-que-fazer-antes-de-ir-pra-valer)
15. [Troubleshooting](#15-troubleshooting)
16. [Avisos importantes sobre ban do WhatsApp](#16-avisos-importantes-sobre-ban-do-whatsapp)

> **TL;DR da arquitetura**: a Vercel chama `POST evo.seudominio.com.br/message/sendText/<instance>`
> com um `apikey`. A Evolution, rodando num VPS seu, repassa pra rede do WhatsApp
> usando um número real que você conectou via QR code. Eventos (status,
> respostas) voltam por webhook pra `https://reserveja.vercel.app/api/webhooks/evolution`.

---

## 1. O que vai existir no final

```
┌──────────────────────────────────────────────────────────────────┐
│  Vercel (Next.js)                                                │
│    src/lib/whatsapp.ts                                           │
│       ↓ fetch                                                    │
│  POST https://evo.seudominio.com.br/message/sendText/reserveja   │
│       headers: apikey: <EVOLUTION_API_KEY>                       │
└──────────────────────────────┬───────────────────────────────────┘
                               │ HTTPS
                               ↓
┌──────────────────────────────────────────────────────────────────┐
│  VPS (Hetzner / Hostinger) — Ubuntu 24.04                        │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  Caddy (porta 80/443)                                   │     │
│  │   ↓ proxy reverso, TLS automático                       │     │
│  │  Evolution API (porta 8080, container)                  │     │
│  │   ↓ usa                                                 │     │
│  │  Postgres (container) + Redis (container)               │     │
│  └─────────────────────────────────────────────────────────┘     │
│                               │                                  │
│                               │ WebSocket persistente            │
│                               ↓                                  │
│                       WhatsApp Web                               │
│                               │                                  │
│                               ↓                                  │
│                    Número real conectado por QR                  │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ↓
                       Cliente recebe mensagem
```

Fluxo reverso (cliente responde, status de entrega, etc.):

```
Cliente envia algo no WhatsApp
  → Evolution recebe
  → Evolution POST https://reserveja.vercel.app/api/webhooks/evolution
  → src/app/api/webhooks/evolution/route.ts (hoje só loga; futuramente
    pode disparar lógica como "marcar como entregue").
```

---

## 2. Decisões prévias e custos

### Decisão 1 — Que número de WhatsApp usar?

**Resposta curta**: compre um **chip novo**, exclusivo pro negócio. Não use o
seu pessoal. Os parágrafos abaixo explicam o porquê — vale a pena ler antes
de seguir, porque entender isso muda como você pensa o resto do setup.

#### O que é "chip dedicado"

Um chip de celular novo (pode ser pré-pago de qualquer operadora — Vivo, Claro,
TIM, Oi — uns R$15-20 na banca/loja), com um número exclusivo pro WhatsApp do
Reserve Já. Exemplo:

- Seu número pessoal: `+55 11 99999-1234` ← **NÃO use esse**
- Chip do negócio: `+55 11 98888-5678` ← é esse que vai pra Evolution

Esse número vira "o WhatsApp oficial do Reserve Já" — diferente de qualquer
outro WhatsApp seu.

#### Por que precisa de um número separado

Aqui está a parte que esclarece tudo. A Evolution API **não é uma API "de
verdade" do WhatsApp** — ela funciona assim por baixo:

1. Você tem um número de WhatsApp instalado em um celular.
2. Você abre WhatsApp → **Aparelhos conectados → Conectar aparelho** → aparece
   um QR code pra escanear.
3. Normalmente esse QR conecta seu WhatsApp ao navegador (WhatsApp Web no
   Chrome).
4. **A Evolution se passa por esse navegador.** Ela escaneia o QR no lugar do
   Chrome.
5. A partir daí, a Evolution fica conectada 24/7 ao WhatsApp daquele número.
   Toda mensagem enviada pela API sai como se você tivesse digitado no
   celular.

> Em outras palavras: Evolution = um "WhatsApp Web fake" rodando 24h no servidor,
> logado com o seu chip.

Daí vêm três restrições:

1. **O número fica "preso" pra esse uso.** Você pode até usar o WhatsApp no
   celular ao mesmo tempo (igual quando você usa Web + celular juntos), mas
   se você **desconectar a sessão pelo celular** ("Aparelhos conectados →
   desconectar"), a Evolution cai e para de mandar mensagens. É uma fonte
   constante de risco de quebra se você usar o número pra outras coisas.

2. **Se WhatsApp banir o número, era.** Como o doc explica na seção final,
   Evolution não é canal oficial — WhatsApp pode entender o uso como suspeito
   e banir o número sem aviso. **Se for seu pessoal, você perde seu WhatsApp
   pessoal** (do dia a dia, família, amigos). Se for um chip do negócio, você
   só perde o chip do negócio — compra outro, reescaneia e segue.

3. **Imagem profissional.** Cliente recebe "Olá Maria! Seu horário em
   Barbearia do João está confirmado..." vinda do número da barbearia, não do
   número pessoal do dono. Mais sério.

#### Analogia

Pensa na Evolution como um **robô que opera um celular pra você**. Esse robô
precisa de **um celular dele** — não pode emprestar o seu, porque:

- Quando o robô tá operando, qualquer mexida sua atrapalha
- Se o "celular" do robô for banido, você não quer que seja o seu
- Pro cliente, é mais sério mensagem do "número da empresa" que do dono

#### Como obter na prática

Mais simples possível:

1. **Vai numa loja ou banca de jornal** e compra um chip pré-pago de qualquer
   operadora (R$15-20).
2. **Coloca num celular qualquer** — pode ser um celular antigo que você tem
   na gaveta. Não precisa ser novo, não precisa de plano de dados, não precisa
   de nada — só funcionar o WhatsApp.
3. **Ativa o chip** seguindo as instruções da operadora (geralmente uma
   ligação ou SMS).
4. **Baixa o WhatsApp** no celular e registra com o número novo.
5. **Usa o WhatsApp por 1-2 semanas como uma pessoa normal**: manda mensagem
   pra si mesmo, pra um amigo, pra família. Salva alguns contatos. Recebe
   algumas mensagens. Isso "esquenta" o número e reduz risco de ban (WhatsApp
   desconfia menos de números com histórico). Mais detalhes na
   [seção sobre ban](#16-avisos-importantes-sobre-ban-do-whatsapp).
6. **Quando o servidor Evolution estiver pronto** (depois de seguir os outros
   passos deste doc), você abre WhatsApp no celular → Aparelhos conectados →
   Conectar aparelho → escaneia o QR da Evolution.
7. **Guarda o celular na gaveta.** Não precisa mais dele no dia a dia. Deixa
   carregando num canto, com sinal. Só precisa estar minimamente vivo pra
   Evolution continuar conectada.

#### Casos especiais

- **"Já tenho um WhatsApp Business do negócio"**: pode usar, mas tem dois
  problemas: (1) se banir, você perde o canal oficial que já existe; (2) você
  não vai mais conseguir usar ele "normalmente" sem risco da sessão cair. Pra
  MVP, recomendo chip novo separado. Quando crescer, migra pra WhatsApp Cloud
  API oficial (que aí sim usa o número do Business sem risco de ban).
- **"Meu negócio só tem telefone fixo"**: WhatsApp aceita fixo, mas a
  ativação por SMS é chata em fixo (precisa pedir verificação por ligação).
  Mais simples comprar um chip móvel pré-pago.
- **"E se eu quiser testar primeiro?"**: pra testar a Evolution rodando, dá
  pra usar um chip qualquer descartável. Quando confirmar que tá tudo OK,
  conecta um chip "definitivo" do negócio. Trocar de número depois exige
  reescanear QR — fácil.

### Decisão 2 — Onde hospedar?

Recomendo **Hetzner Cloud (CX22)** pelo custo-benefício:

- €4.51/mês (~R$25) — 2 vCPU, 4 GB RAM, 40 GB SSD, 20 TB tráfego
- Datacenters em Helsinki, Nuremberg, Hillsboro (US) ou Ashburn (US)
- Setup em 30 segundos
- <https://www.hetzner.com/cloud>

Alternativas equivalentes:

| Provedor | Plano | Preço | Onde |
| --- | --- | --- | --- |
| **Hetzner** | CX22 | ~R$25/mês | EU/US |
| **Hostinger** | KVM 1 | ~R$15/mês (promo) | Vários |
| **DigitalOcean** | Basic Droplet 1GB | $6/mês | US/EU/SG |
| **Vultr** | High Frequency 1GB | $6/mês | Vários |

**RAM mínima**: 2 GB. Evolution + Postgres + Redis num container apertado roda
em 1 GB com swap, mas é desconfortável.

### Decisão 3 — Que domínio?

Use um subdomínio do seu domínio principal. Se você ainda não tem domínio:

- **Registro.br** — `.com.br`, R$40/ano. Brasileiro, suporte em português.
- **Cloudflare Registrar** — `.com`/`.app`/`.dev`, ~US$10-12/ano. **Sem markup**
  (preço de custo), mas precisa transferir pra eles. Recomendo se você vai
  usar Cloudflare como DNS de qualquer forma.
- **Namecheap** — alternativa popular.

Vou usar `seudominio.com.br` como exemplo no resto do doc. O subdomínio da
Evolution vai ser `evo.seudominio.com.br`.

### Custo total estimado (mensal)

- VPS: ~R$25
- Domínio: ~R$3 (R$40/ano amortizado)
- Chip WhatsApp dedicado: ~R$15 (pré-pago básico)
- **Total: ~R$45/mês**

---

## 3. Passo 1 — Registrar um domínio

Se você já tem um domínio (mesmo um que você usa pra outra coisa), pula essa
seção e vai pro passo 3 (DNS).

### Pelo Registro.br

1. Acesse <https://registro.br>.
2. Pesquise o domínio desejado (ex.: `reservejaapp.com.br`).
3. Crie conta com seu CPF.
4. Pague o anual (~R$40 com cartão ou boleto).
5. Aguarde alguns minutos pra propagação inicial.

### Pelo Cloudflare Registrar

1. Crie conta em <https://cloudflare.com>.
2. Em **Domain Registration → Register Domains**, pesquise o nome.
3. Pague (~US$10-12/ano).
4. Domínio já fica com DNS no Cloudflare por padrão.

> Se foi pelo Registro.br, vale **transferir o DNS pro Cloudflare** (não o
> registro do domínio, só a gestão de DNS). Cloudflare é grátis e mais
> rápido. Como: criar zona no Cloudflare, copiar os nameservers que ele
> indica, colar no painel do Registro.br em "Servidores DNS".

---

## 4. Passo 2 — Contratar VPS

### Hetzner (recomendado)

1. <https://accounts.hetzner.com/signUp> — crie conta.
2. **Cloud Console → New Project → Add Server**.
3. **Location**: Falkenstein (DE) ou Ashburn (US). Pra Brasil, Ashburn tem
   menos latência mas Falkenstein é mais barato. A diferença de latência (50ms
   vs 150ms) **não importa** pra envio de WhatsApp.
4. **Image**: Ubuntu 24.04.
5. **Type**: CX22 (Shared vCPU x86, 2 vCPU, 4 GB).
6. **SSH Keys**: cole sua chave pública (`~/.ssh/id_ed25519.pub` ou `id_rsa.pub`).
   Se não tem chave SSH:
   ```bash
   ssh-keygen -t ed25519 -C "seu@email.com"
   cat ~/.ssh/id_ed25519.pub          # copia o conteúdo
   ```
7. **Name**: `reserveja-evo` (ou qualquer coisa).
8. **Create & Buy now**.

Em 30 segundos você recebe o IPv4 do servidor (algo como `5.161.42.xxx`).
**Anote esse IP**.

### Hostinger (alternativa BR)

1. <https://www.hostinger.com.br/vps-hosting>.
2. KVM 1, Ubuntu 24.04 LTS.
3. Defina senha root forte ou suba sua chave SSH.
4. Anote o IP que aparece no painel.

---

## 5. Passo 3 — Apontar DNS do subdomínio

No painel do Cloudflare (ou onde mora seu DNS), crie um registro:

| Type | Name | Content | Proxy | TTL |
| ---- | ---- | ------- | ----- | --- |
| `A` | `evo` | `5.161.42.xxx` (IP do VPS) | **DNS only** (cinza) | Auto |

> **Importante**: deixe o proxy do Cloudflare **desligado** (nuvem cinza, não
> laranja). O Cloudflare proxiado bloqueia conexões WebSocket persistentes em
> alguns planos e atrapalha o Caddy a fazer challenge HTTP-01 do Let's Encrypt
> nas portas padrão. Deixar DNS only resolve.

Confira propagação:

```bash
dig +short evo.seudominio.com.br
# deve retornar o IP do VPS
```

DNS propaga em segundos com Cloudflare, em minutos no Registro.br.

---

## 6. Passo 4 — Preparar o servidor

Conecte via SSH:

```bash
ssh root@5.161.42.xxx
```

### 6.1. Criar usuário não-root

```bash
adduser deploy
usermod -aG sudo deploy

# Copia a chave SSH pro novo usuário
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

Saia e entre como `deploy`:

```bash
exit
ssh deploy@5.161.42.xxx
```

### 6.2. Atualizar sistema e firewall

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ufw

sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp        # SSH
sudo ufw allow 80/tcp        # HTTP (Caddy precisa pro challenge do Let's Encrypt)
sudo ufw allow 443/tcp       # HTTPS
sudo ufw enable
```

### 6.3. Instalar Docker + Compose

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker deploy

# Sai e entra de novo pra aplicar o grupo
exit
ssh deploy@5.161.42.xxx

docker --version             # confere
docker compose version       # já vem como plugin
```

### 6.4. (Opcional, mas recomendado) Habilitar swap

Se seu VPS tem só 2 GB de RAM, swap evita OOM kills:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 7. Passo 5 — Subir Evolution API com Docker Compose

### 7.1. Estrutura de pastas

```bash
mkdir -p ~/evolution
cd ~/evolution
```

### 7.2. Criar `.env` da Evolution

```bash
nano .env
```

Cole e ajuste os valores marcados `<TROCAR>`:

```env
# ============== Autenticação da própria Evolution ==============
# Essa é a chave global de admin da Evolution. Quem tem essa chave
# pode criar/deletar instances. Gere com: openssl rand -hex 32
AUTHENTICATION_API_KEY=<TROCAR-com-32-bytes-hex>

# ============== Banco (Postgres dedicado da Evolution) ==============
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://evolution:evolution-strong-pw@postgres:5432/evolution
DATABASE_CONNECTION_CLIENT_NAME=evolution_exchange

# ============== Cache ==============
CACHE_REDIS_ENABLED=true
CACHE_REDIS_URI=redis://redis:6379/6
CACHE_REDIS_PREFIX_KEY=evolution
CACHE_REDIS_SAVE_INSTANCES=false

# ============== Logs ==============
LOG_LEVEL=ERROR,WARN,INFO
LOG_COLOR=true
LOG_BAILEYS=error

# ============== Sessão (Baileys) ==============
CONFIG_SESSION_PHONE_CLIENT=Reserve Já
CONFIG_SESSION_PHONE_NAME=Chrome

# ============== Storage local de QR/mídia ==============
DEL_INSTANCE=false
STORE_MESSAGES=true
STORE_MESSAGE_UP=true
STORE_CONTACTS=true
STORE_CHATS=true

# ============== Webhook global default ==============
# Você também pode setar por instance. Esse é o fallback.
WEBHOOK_GLOBAL_URL=https://reserveja.vercel.app/api/webhooks/evolution
WEBHOOK_GLOBAL_ENABLED=true
WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=false

# ============== Server ==============
SERVER_PORT=8080
SERVER_URL=https://evo.seudominio.com.br
```

### 7.3. Criar `docker-compose.yml`

```bash
nano docker-compose.yml
```

```yaml
services:
  evolution-api:
    image: atendai/evolution-api:v2.2.0
    container_name: evolution-api
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    env_file: .env
    volumes:
      - evolution_instances:/evolution/instances
    expose:
      - "8080"
    networks: [evo]

  postgres:
    image: postgres:16-alpine
    container_name: evolution-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: evolution
      POSTGRES_PASSWORD: evolution-strong-pw
      POSTGRES_DB: evolution
    volumes:
      - evolution_pg:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U evolution"]
      interval: 5s
      timeout: 5s
      retries: 10
    networks: [evo]

  redis:
    image: redis:7-alpine
    container_name: evolution-redis
    restart: unless-stopped
    volumes:
      - evolution_redis:/data
    networks: [evo]

  caddy:
    image: caddy:2-alpine
    container_name: evolution-caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - evolution-api
    networks: [evo]

volumes:
  evolution_instances:
  evolution_pg:
  evolution_redis:
  caddy_data:
  caddy_config:

networks:
  evo:
```

> Versão da imagem: estou fixando em `v2.2.0`. Confira a tag estável atual em
> <https://hub.docker.com/r/atendai/evolution-api/tags>. **Não use `latest`** —
> atualizações podem quebrar e você não vai perceber.

---

## 8. Passo 6 — HTTPS automático com Caddy

Crie o `Caddyfile`:

```bash
nano Caddyfile
```

```caddyfile
evo.seudominio.com.br {
    reverse_proxy evolution-api:8080
    encode gzip
    log {
        output stdout
        format console
    }
}
```

> O Caddy descobre o certificado HTTPS sozinho via Let's Encrypt. **Pré-requisito**:
> o DNS já estar apontando pro IP (passo 5) e a porta 80 estar liberada
> (passo 6.2).

Suba tudo:

```bash
docker compose up -d
docker compose logs -f caddy
```

Espera ver algo como:

```
INF certificate obtained successfully ...
INF serving initial configuration ...
```

Teste de fora:

```bash
curl -i https://evo.seudominio.com.br
# deve retornar JSON da Evolution (status, version)
```

Se não respondeu: ver seção [Troubleshooting](#15-troubleshooting).

---

## 9. Passo 7 — Criar instance e escanear QR code

A Evolution suporta múltiplas "instances" (cada uma é um número de WhatsApp).
Pra o Reserve Já, vamos criar uma chamada `reserveja`.

### 9.1. Criar a instance

Use a `AUTHENTICATION_API_KEY` que você gerou no `.env`:

```bash
curl -X POST https://evo.seudominio.com.br/instance/create \
  -H "apikey: <AUTHENTICATION_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "reserveja",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS",
    "webhook": {
      "url": "https://reserveja.vercel.app/api/webhooks/evolution",
      "events": ["MESSAGES_UPSERT","SEND_MESSAGE","CONNECTION_UPDATE"]
    }
  }'
```

A resposta inclui um `hash` (token) e um QR code base64. Você pode:

- Decodificar o base64 e abrir como imagem
- **OU** (mais fácil) abrir o manager web da Evolution: `https://evo.seudominio.com.br/manager`
  (caso a versão tenha — algumas versões da v2 expõem; senão use a API).

### 9.2. Escanear o QR

No celular com o chip dedicado, abra WhatsApp → **Aparelhos conectados →
Conectar aparelho** → escaneie o QR.

Aguarde alguns segundos. O endpoint de status confirma:

```bash
curl https://evo.seudominio.com.br/instance/connectionState/reserveja \
  -H "apikey: <AUTHENTICATION_API_KEY>"

# Esperado: {"state":"open"} ou similar
```

### 9.3. Teste de envio direto

```bash
curl -X POST https://evo.seudominio.com.br/message/sendText/reserveja \
  -H "apikey: <AUTHENTICATION_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "text": "Teste do Reserve Já 🎉"
  }'
```

Mensagem chega no WhatsApp do número que você passou em `number`. Se chegou,
está pronto pra plugar no app.

---

## 10. Passo 8 — Configurar webhook na Evolution

Já configuramos no `create` acima. Se quiser **mudar depois**, ou se a
instance foi criada sem webhook:

```bash
curl -X POST https://evo.seudominio.com.br/webhook/set/reserveja \
  -H "apikey: <AUTHENTICATION_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://reserveja.vercel.app/api/webhooks/evolution",
    "enabled": true,
    "events": ["MESSAGES_UPSERT","SEND_MESSAGE","CONNECTION_UPDATE"]
  }'
```

> **Evolução futura**: hoje `src/app/api/webhooks/evolution/route.ts` só loga.
> Quando você quiser reagir a status de entrega ou respostas do cliente,
> implementa a lógica lá (ex.: marcar booking como "lido pelo cliente").
> Considere também validar a origem (assinatura, IP allowlist, ou um token
> compartilhado em header customizado) — Evolution não assina, mas você pode
> usar um proxy intermediário ou só checar o `User-Agent` + um token na URL
> tipo `/api/webhooks/evolution?token=...`.

---

## 11. Passo 9 — Plugar na Vercel

Na Vercel → Project → Settings → Environment Variables (production + preview):

| Nome | Valor |
| ---- | ----- |
| `EVOLUTION_API_URL` | `https://evo.seudominio.com.br` |
| `EVOLUTION_API_KEY` | a `AUTHENTICATION_API_KEY` que você gerou |
| `EVOLUTION_INSTANCE` | `reserveja` |

Salve e **rode um redeploy** (Settings → Deployments → Redeploy do último build),
porque variáveis novas não entram em deploys já construídos.

### O que o código vai fazer agora

`src/lib/whatsapp.ts` hoje:

```ts
const baseUrl = process.env.EVOLUTION_API_URL
const apiKey = process.env.EVOLUTION_API_KEY
const instance = process.env.EVOLUTION_INSTANCE ?? "default"

export async function sendText({ phone, message }) {
  if (!baseUrl || !apiKey) {
    console.warn("[whatsapp] envs não configuradas — mensagem ignorada", ...)
    return { ok: false }
  }
  // POST {baseUrl}/message/sendText/{instance}
  ...
}
```

Com as envs setadas, as duas mensagens automáticas começam a sair:

- **Confirmação** — `src/server/notifications/booking.ts → sendBookingConfirmation`
  (chamado quando um booking é criado).
- **Lembrete** — `sendBookingReminder`, disparado pelo cron
  `GET /api/cron/booking-reminders` (protegido por `CRON_SECRET`).

> Pro cron funcionar em produção, configure também `CRON_SECRET` na Vercel e
> ative o Vercel Cron apontando pra `/api/cron/booking-reminders` (a Vercel
> envia `Authorization: Bearer <CRON_SECRET>` automaticamente quando o cron
> está configurado pelo dashboard ou via `vercel.json`).

---

## 12. Passo 10 — Testar end-to-end

1. Acesse `https://reserveja.vercel.app/barbearia-do-joao/agendar` (ou seu
   estabelecimento de teste).
2. Crie um booking com **o seu número real de WhatsApp** como cliente.
3. Em segundos, a mensagem de confirmação chega.
4. No VPS, confere o log:
   ```bash
   docker compose logs -f evolution-api
   ```
   Você verá o `MESSAGE_UPSERT` ou similar passando.
5. Na Vercel, em **Logs**, confere o log do route handler de
   `/api/webhooks/evolution` — deve aparecer o evento chegando.

Se algo não chegou: veja [Troubleshooting](#15-troubleshooting).

---

## 13. Operação: backup, atualização, logs

### Backup do banco da Evolution

A Evolution armazena instances, contatos e histórico no Postgres dela. Pra
backup diário simples:

```bash
mkdir -p ~/backups
nano ~/backups/backup-evo.sh
```

```bash
#!/bin/bash
set -e
TS=$(date +%Y%m%d-%H%M)
docker exec evolution-postgres pg_dump -U evolution evolution \
  | gzip > ~/backups/evolution-$TS.sql.gz
# Mantém só os últimos 7 dias
find ~/backups -name "evolution-*.sql.gz" -mtime +7 -delete
```

```bash
chmod +x ~/backups/backup-evo.sh
crontab -e
# Adiciona:
0 3 * * * /home/deploy/backups/backup-evo.sh >> /home/deploy/backups/backup.log 2>&1
```

Pra restaurar:

```bash
gunzip < evolution-AAAAMMDD-HHMM.sql.gz \
  | docker exec -i evolution-postgres psql -U evolution evolution
```

### Atualizar Evolution

```bash
cd ~/evolution

# 1. Backup primeiro!
./backups/backup-evo.sh

# 2. Editar docker-compose.yml e mudar a tag pra versão nova
# Ex.: atendai/evolution-api:v2.3.0

# 3. Puxar e subir
docker compose pull
docker compose up -d

# 4. Conferir
docker compose logs -f evolution-api
```

> Antes de atualizar, **leia o changelog** em
> <https://github.com/EvolutionAPI/evolution-api/releases>. Versões maiores
> (v2 → v3) frequentemente exigem migração manual de schema.

### Ver logs

```bash
docker compose logs -f evolution-api        # tempo real
docker compose logs --tail=200 evolution-api
docker compose logs caddy                    # logs do proxy/HTTPS
```

### Reiniciar tudo

```bash
docker compose restart
# ou só uma:
docker compose restart evolution-api
```

### Espaço em disco

Logs e mídia crescem. Confira mensalmente:

```bash
df -h
docker system df
# limpar imagens/containers antigos:
docker system prune -a
```

---

## 14. Endurecimento: o que fazer antes de ir pra valer

O setup acima funciona — mas pra produção real:

1. **Trocar a `AUTHENTICATION_API_KEY` por algo bem aleatório** (32+ bytes hex).
   Quem tem essa chave pode criar/deletar instances. Trate como senha de root.

2. **Restringir acesso à API por IP** (se quiser ser paranoico): adicione no
   Caddyfile uma diretiva que só aceita requests de IPs conhecidos. Difícil
   na Vercel (IPs serverless mudam), então geralmente não vale a pena. Em
   vez disso, **rotacione a apikey periodicamente**.

3. **Fail2ban** pra bloquear SSH brute-force:
   ```bash
   sudo apt install -y fail2ban
   sudo systemctl enable --now fail2ban
   ```

4. **SSH só por chave** (sem senha): edite `/etc/ssh/sshd_config`:
   ```
   PasswordAuthentication no
   PermitRootLogin no
   ```
   ```bash
   sudo systemctl restart ssh
   ```

5. **Monitoramento simples** — UptimeRobot (free) pingando
   `https://evo.seudominio.com.br` a cada 5 min. Te avisa por email se cair.

6. **Validar o webhook chegando na Vercel** — adicionar um token na URL:
   ```
   https://reserveja.vercel.app/api/webhooks/evolution?token=<segredo>
   ```
   E o handler verifica o token antes de processar.

---

## 15. Troubleshooting

### "curl https://evo.seudominio.com.br dá Connection refused"

- DNS ainda não propagou: `dig +short evo.seudominio.com.br` retorna o IP certo?
- UFW está bloqueando 80/443? `sudo ufw status`
- Caddy não subiu? `docker compose logs caddy`

### "HTTPS dando erro de certificado"

- Cloudflare proxy está em modo nuvem-laranja? Desligue (DNS only).
- Porta 80 fechada? Let's Encrypt precisa dela pro challenge HTTP-01.
- Limites do Let's Encrypt? Esperar 1h e tentar de novo.

### "Instance criada mas QR não conecta"

- O número já está usado em outra Evolution/sessão Web ativa? Faz logout em
  WhatsApp → Aparelhos conectados → remove todos.
- Versão do WhatsApp no celular muito antiga? Atualize.

### "Conectou, mas as mensagens não chegam no cliente"

- `connectionState` está `open`? Se não, scaneia QR de novo.
- Número está em E.164 sem `+`? Evolution espera `5511999999999`, não
  `+5511999999999`. O wrapper `src/lib/whatsapp.ts` já tira o `+` com
  `replace(/\D/g, "")`.
- WhatsApp marcou o número como spam? Tenta enviar manualmente pelo celular —
  se chegou, é volume/conteúdo da Evolution.

### "Mensagens chegam, mas webhook não atinge a Vercel"

- A URL no webhook está com HTTPS e domínio público? `localhost` não funciona.
- Vercel está retornando 200? Veja Vercel → Logs → procure por
  `/api/webhooks/evolution`.
- Evolution está com webhook habilitado? Confira:
  ```bash
  curl https://evo.seudominio.com.br/webhook/find/reserveja \
    -H "apikey: <AUTHENTICATION_API_KEY>"
  ```

### "Tudo funcionava e do nada parou"

- Container caiu por OOM? `dmesg | grep -i kill` ou `docker compose ps`. Aumente
  swap (passo 6.4) ou faça upgrade do plano.
- Sessão WhatsApp expirada? Reescanear QR. Acontece se o celular ficou muito
  tempo offline ou se WhatsApp Web forçou logout por inatividade.
- Disco cheio? `df -h`. Limpe logs e mídia antiga, considere mover
  `evolution_instances` pra volume maior.

### "Quero ver as mensagens armazenadas"

```bash
docker exec -it evolution-postgres psql -U evolution -d evolution
# Dentro:
\dt                   # lista tabelas
SELECT * FROM "Message" ORDER BY "createdAt" DESC LIMIT 10;
\q
```

---

## 16. Avisos importantes sobre ban do WhatsApp

A Evolution **não** é canal oficial. Ela usa WhatsApp Web por baixo. Isso traz
riscos reais:

- **WhatsApp pode banir o número a qualquer momento.** Sem aviso, sem recurso
  formal. O número fica inviável (pessoal e profissional) por dias ou pra
  sempre.
- **Comportamento que aumenta risco**:
  - Volume alto e súbito (mandar pra centenas de números nunca contatados)
  - Mensagens idênticas em sequência (parece spam)
  - Receber muitos "denunciar" de clientes
  - Conta nova num número que nunca usou WhatsApp
- **Como reduzir risco**:
  - **Aqueça o número**: use ele por 1-2 semanas no celular normalmente antes
    de plugar na Evolution (mandar mensagem pra amigos/família, ter contatos
    salvos).
  - **Volume gradual**: comece com 5-10 mensagens/dia, vá aumentando.
  - **Conteúdo variável**: o template do `sendBookingConfirmation` já varia o
    nome, hora, profissional — bom sinal. Evite mensagens 100% idênticas.
  - **Só responda a clientes que iniciaram**: o Reserve Já só manda quando o
    cliente fez o booking — comportamento legítimo.
  - **Não use pra marketing em massa**. Não use cold outreach. Isso é o que
    faz banir.

Quando o produto crescer (1000+ bookings/mês), é hora de migrar pra
**WhatsApp Cloud API oficial da Meta**. Custa por conversa (~R$0,30), mas
zero risco de ban. A reescrita é só em `src/lib/whatsapp.ts` — a interface
(`sendText({phone, message})`) continua igual.

---

## Resumo das envs envolvidas

No **VPS** (`~/evolution/.env`):

```env
AUTHENTICATION_API_KEY=<32-bytes-hex>
DATABASE_CONNECTION_URI=postgresql://evolution:evolution-strong-pw@postgres:5432/evolution
CACHE_REDIS_URI=redis://redis:6379/6
WEBHOOK_GLOBAL_URL=https://reserveja.vercel.app/api/webhooks/evolution
SERVER_URL=https://evo.seudominio.com.br
```

Na **Vercel** (Settings → Environment Variables):

```env
EVOLUTION_API_URL=https://evo.seudominio.com.br
EVOLUTION_API_KEY=<a mesma AUTHENTICATION_API_KEY do .env do VPS>
EVOLUTION_INSTANCE=reserveja
```

E pronto — confirmações e lembretes saem sozinhos.
