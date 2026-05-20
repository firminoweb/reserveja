import { cn } from "@/lib/utils"

const STEPS = [
  { n: 1, label: "Serviço" },
  { n: 2, label: "Horário" },
  { n: 3, label: "Seus dados" },
]

export function Stepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="flex items-center gap-2 text-xs">
      {STEPS.map((step, i) => {
        const done = step.n < current
        const active = step.n === current
        return (
          <li key={step.n} className="flex items-center gap-2">
            <span
              className={cn(
                "size-6 rounded-full flex items-center justify-center font-medium",
                done && "bg-foreground text-background",
                active && "bg-primary text-primary-foreground",
                !done && !active && "bg-muted text-muted-foreground",
              )}
            >
              {done ? "✓" : step.n}
            </span>
            <span className={cn(active ? "text-foreground font-medium" : "text-muted-foreground")}>
              {step.label}
            </span>
            {i < STEPS.length - 1 ? (
              <span className="w-4 h-px bg-border" aria-hidden />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
