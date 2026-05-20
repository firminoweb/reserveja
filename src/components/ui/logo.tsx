import { cn } from "@/lib/utils"

type LogoProps = {
  className?: string
  iconClassName?: string
  textClassName?: string
  variant?: "full" | "icon"
  /** Quando true, força fundo/texto claros (use sobre indigo sólido). */
  onDark?: boolean
}

export function LogoMark({
  className,
  onDark = false,
}: {
  className?: string
  onDark?: boolean
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-[28%] shrink-0",
        onDark
          ? "bg-primary-foreground text-primary"
          : "bg-primary text-primary-foreground",
        className,
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-[60%] h-[60%]"
      >
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M3 9h18" />
        <path d="M8 3v4" />
        <path d="M16 3v4" />
        <path d="M8.5 14.5l2.2 2.2L15.5 12" />
      </svg>
    </span>
  )
}

/**
 * Logo do Reserve Já — ícone + wordmark. `variant="icon"` mostra só o quadrado.
 * Tamanho controlado por className (text-* dita escala do wordmark; ícone
 * acompanha automaticamente).
 */
export function Logo({
  className,
  iconClassName,
  textClassName,
  variant = "full",
  onDark = false,
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark
        onDark={onDark}
        className={cn("size-8", iconClassName)}
      />
      {variant === "full" ? (
        <span
          className={cn(
            "font-bold tracking-tight leading-none",
            onDark ? "text-primary-foreground" : "text-foreground",
            textClassName,
          )}
        >
          reserve<span className="text-primary">já</span>
          <span
            className={cn(
              "font-medium",
              onDark ? "text-primary-foreground/70" : "text-muted-foreground",
            )}
          >
            .app
          </span>
        </span>
      ) : null}
    </span>
  )
}
