"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

const formatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

type Props = Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
  /** Valor em centavos (inteiro). */
  value: number
  /** Recebe o novo valor em centavos. */
  onChange: (cents: number) => void
}

/**
 * Input de moeda BRL. Mantém o estado interno em centavos pra evitar problemas
 * de ponto flutuante (R$ 0,29 vira sempre 29 — não 0.29000004).
 *
 * Comportamento: usuário só digita números. Cada dígito vai pra direita; a
 * vírgula decimal é fixa nas duas últimas casas. Exemplo:
 *   tecla "5"   → R$ 0,05
 *   tecla "0"   → R$ 0,50
 *   tecla "0"   → R$ 5,00
 *   backspace   → R$ 0,50
 */
export function MoneyInput({ value, onChange, className, ...rest }: Props) {
  return (
    <Input
      {...rest}
      type="text"
      inputMode="numeric"
      value={formatter.format((value || 0) / 100)}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "")
        onChange(digits ? Number(digits) : 0)
      }}
      className={cn("text-right tabular-nums", className)}
    />
  )
}
