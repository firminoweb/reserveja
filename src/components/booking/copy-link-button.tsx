"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  url: string
  label?: string
  className?: string
}

export function CopyLinkButton({ url, label = "Copiar link", className }: Props) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        const ta = document.createElement("textarea")
        ta.value = url
        ta.style.position = "fixed"
        ta.style.opacity = "0"
        document.body.appendChild(ta)
        ta.select()
        document.execCommand("copy")
        document.body.removeChild(ta)
      }
      setCopied(true)
      toast.success("Link copiado!")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Não foi possível copiar. Copie manualmente.")
    }
  }

  return (
    <div
      className={cn(
        "flex items-stretch gap-2 rounded-lg border bg-card p-1.5 shadow-sm",
        className,
      )}
    >
      <div className="flex-1 min-w-0 px-2.5 self-center text-xs sm:text-sm text-muted-foreground truncate font-mono">
        {url}
      </div>
      <Button
        type="button"
        size="sm"
        variant={copied ? "default" : "secondary"}
        onClick={copy}
        className="shrink-0 gap-1.5"
        aria-label={label}
      >
        {copied ? (
          <>
            <Check className="size-4" />
            <span className="hidden sm:inline">Copiado</span>
          </>
        ) : (
          <>
            <Copy className="size-4" />
            <span className="hidden sm:inline">Copiar</span>
          </>
        )}
      </Button>
    </div>
  )
}
