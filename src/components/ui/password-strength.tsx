"use client"

import { cn } from "@/lib/utils"

/**
 * Indicador visual de força de senha. Heurística simples baseada em comprimento
 * + variedade de caracteres. Não bloqueia o submit — só dá feedback.
 *
 * Segue NIST 800-63B: comprimento mínimo é a única regra dura; composição é
 * só sinal pro usuário, não exigência.
 */

type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string }

function score(password: string): Strength["score"] {
  if (!password) return 0
  if (password.length < 8) return 1
  let variety = 0
  if (/[a-z]/.test(password)) variety++
  if (/[A-Z]/.test(password)) variety++
  if (/\d/.test(password)) variety++
  if (/[^A-Za-z0-9]/.test(password)) variety++
  if (variety <= 1) return 1
  if (variety === 2 && password.length < 10) return 2
  if (variety === 2) return 3
  if (variety === 3 && password.length < 12) return 3
  return 4
}

const LABEL: Record<Strength["score"], string> = {
  0: "—",
  1: "Fraca",
  2: "Razoável",
  3: "Forte",
  4: "Muito forte",
}

const COLOR: Record<Strength["score"], string> = {
  0: "bg-muted",
  1: "bg-destructive",
  2: "bg-amber-500",
  3: "bg-emerald-500",
  4: "bg-emerald-600",
}

type Props = {
  password: string
  className?: string
}

export function PasswordStrength({ password, className }: Props) {
  const s = score(password)
  const filledBars = Math.max(s, 0)

  return (
    <div className={cn("flex items-center gap-2 text-xs", className)} aria-live="polite">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= filledBars ? COLOR[s] : "bg-muted",
            )}
          />
        ))}
      </div>
      <span
        className={cn(
          "min-w-24 text-right tabular-nums",
          s <= 1
            ? "text-destructive"
            : s === 2
              ? "text-amber-700 dark:text-amber-500"
              : s >= 3
                ? "text-emerald-700 dark:text-emerald-500"
                : "text-muted-foreground",
        )}
      >
        {password ? LABEL[s] : ""}
      </span>
    </div>
  )
}
