import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const STEPS = [
  { n: 1, label: "Serviço" },
  { n: 2, label: "Horário" },
  { n: 3, label: "Seus dados" },
]

export function Stepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="flex w-full items-center gap-1.5 sm:gap-2 text-xs">
      {STEPS.map((step, i) => {
        const done = step.n < current
        const active = step.n === current
        return (
          <li
            key={step.n}
            className={cn(
              "flex items-center gap-2 min-w-0",
              i < STEPS.length - 1 ? "flex-1" : "shrink-0",
            )}
          >
            <span
              className={cn(
                "size-7 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold",
                done && "bg-primary text-primary-foreground",
                active &&
                  "bg-primary text-primary-foreground ring-4 ring-primary/15",
                !done && !active && "bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check className="size-4" aria-hidden /> : step.n}
            </span>
            <span
              className={cn(
                "truncate hidden sm:inline",
                active
                  ? "text-foreground font-medium"
                  : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
            {/* Em mobile, mostra label só do passo ativo */}
            <span
              className={cn(
                "truncate sm:hidden",
                active ? "text-foreground font-medium" : "sr-only",
              )}
            >
              {step.label}
            </span>
            {i < STEPS.length - 1 ? (
              <span
                className={cn(
                  "flex-1 h-px",
                  done ? "bg-primary/50" : "bg-border",
                )}
                aria-hidden
              />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
