# Reserve Já — Design System

Sistema visual baseado no moodboard `reserveja_01.png`. Objetivo: identidade
profissional + acessibilidade pra público amplo (idosos, míopes, low-vision).

## Princípios

- **Touch targets ≥ 44px** (WCAG 2.5.5). Botões e inputs default = 44px.
- **Texto base 16px sempre** — sem encolher pra 14px no desktop. Em formulários, labels com peso medium pra hierarquia clara.
- **Contraste AAA** quando possível em texto crítico (proporção ≥ 7:1). Cinza médio do moodboard fica só pra labels secundários.
- **Cantos suaves** (radius 0.75rem default) — bate com o moodboard, evita sensação clínica.
- **Focus ring grosso** (4px) — quem usa teclado/leitor vê claramente.

## Paleta

### Cor primária — Indigo `#4F46E5`

Profundo, sério, profissional. Pareado com fundos claros funciona bem em texto,
botões, badges. Em dark mode, sobe pra `#818CF8` pra manter contraste.

| Token | Light | Dark | Uso |
|---|---|---|---|
| `--primary` | `oklch(0.51 0.24 282)` | `oklch(0.70 0.18 282)` | Botão principal, links, ring de foco |
| `--primary-foreground` | `oklch(0.98 0.005 280)` | `oklch(0.13 0.02 285)` | Texto sobre primary |

### Neutros

| Token | Light | Dark |
|---|---|---|
| `--background` | `oklch(1 0 0)` (branco puro) | `oklch(0.13 0.02 285)` (quase preto com cast roxo) |
| `--foreground` | `oklch(0.16 0.02 285)` (preto com leve cast) | `oklch(0.97 0.005 280)` |
| `--card` | `oklch(1 0 0)` | `oklch(0.18 0.02 285)` |
| `--muted` | `oklch(0.97 0.005 280)` | `oklch(0.22 0.015 285)` |
| `--muted-foreground` | `oklch(0.47 0.02 285)` | `oklch(0.68 0.015 285)` |
| `--border` | `oklch(0.90 0.01 280)` | `oklch(0.28 0.015 285)` |
| `--input` | `oklch(0.88 0.01 280)` | `oklch(0.30 0.02 285)` |
| `--ring` | `oklch(0.51 0.24 282)` | `oklch(0.70 0.18 282)` |

### Destructive (mantida)

`oklch(0.577 0.245 27.325)` light / `oklch(0.704 0.191 22.216)` dark. Usada em
botões de excluir e mensagens de erro.

### Acento (creme/bege do moodboard)

Reservado pra usos pontuais (badges premium, callouts). Não é cor de sistema
no MVP — fica documentado pra v1.1.

`oklch(0.94 0.025 75)` — bege papelaria

## Tipografia

**Família única**: Poppins (Google Fonts). Pesos carregados: 300/400/500/600/700.

- `--font-sans`: Poppins
- `--font-mono`: Geist Mono (mantida pra slugs/códigos)

### Escala

Texto-base = 16px. Tailwind defaults usados:
- `text-base` (16px) — corpo de texto, inputs, botões default
- `text-sm` (14px) — labels secundários, hints, badges
- `text-lg` (18px) — botões grandes
- `text-xl/2xl/3xl` — títulos

### Pesos

- Labels de formulário: **medium (500)**
- Botões: **medium (500)**
- Títulos h1-h2: **bold (700)**
- Títulos h3-h4: **semibold (600)**
- Corpo: **regular (400)**

## Radius

`--radius: 0.75rem`. Componentes shadcn derivam dele:
- `--radius-sm`: 0.45rem
- `--radius-md`: 0.6rem
- `--radius-lg`: 0.75rem
- `--radius-xl`: 1.05rem (cards)

## Componentes — overrides

### Button (`src/components/ui/button.tsx`)

| size | height | text |
|---|---|---|
| `default` | 44px (`h-11`) | `text-base` |
| `lg` | 52px (`h-13`) | `text-lg` |
| `sm` | 36px (`h-9`) | `text-sm` |
| `xs` | 28px (`h-7`) | `text-xs` |
| `icon` | 44×44 | — |

Default `font-medium`. Focus ring 4px (era 3px).

### Input (`src/components/ui/input.tsx`)

- Altura: 44px (`h-11`)
- Texto: `text-base` em todos os breakpoints (era `md:text-sm`)
- Padding horizontal: `px-3.5` (era `px-2.5`)
- Border: usa `--input` com 1.5px

### Focus

`focus-visible:ring-4 focus-visible:ring-ring/40` em controles interativos.

## Espaçamento

Tailwind defaults. Convenção:
- Forms: `space-y-5` entre campos (era `space-y-4`).
- Páginas: `px-6 py-8` mínimo, `px-8` em desktop largo.
- Cards: `p-5` ou `p-6`.

## Acessibilidade — checklist quando criar tela nova

- [ ] Touch target ≥ 44×44 em controles tappable.
- [ ] Texto ≥ 16px.
- [ ] Contraste verificado (use `https://oklch.com` ou Chrome DevTools).
- [ ] Estado de foco visível.
- [ ] Labels visíveis (não placeholder-only).
- [ ] Errors com cor + ícone (não só cor).
- [ ] Suporte a `prefers-reduced-motion` se animar.
