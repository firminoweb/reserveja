"use client"

import { useState } from "react"
import { useFormContext } from "react-hook-form"
import { Loader2 } from "lucide-react"

import { Input } from "@/components/ui/input"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { lookupCep, maskCep, cepDigits, isValidCep } from "@/lib/viacep"

/**
 * Conjunto de campos de endereço (BR) usável em qualquer form que tenha:
 *   cep, street, streetNumber, complement, neighborhood, city, state
 *
 * O CEP busca no ViaCEP onBlur (se 8 dígitos) e autopopula os outros campos.
 * Não bloqueia o submit em caso de falha — só não preenche.
 */
export function AddressFields() {
  const form = useFormContext()
  const [lookingUp, setLookingUp] = useState(false)
  const [lookupErr, setLookupErr] = useState<string | null>(null)

  async function onCepBlur(rawCep: string) {
    setLookupErr(null)
    if (!isValidCep(rawCep)) return
    setLookingUp(true)
    const result = await lookupCep(rawCep)
    setLookingUp(false)
    if (!result) {
      setLookupErr("CEP não encontrado — preencha manualmente")
      return
    }
    if (result.street) {
      form.setValue("street", result.street, { shouldValidate: true })
    }
    if (result.neighborhood) {
      form.setValue("neighborhood", result.neighborhood, { shouldValidate: true })
    }
    if (result.city) {
      form.setValue("city", result.city, { shouldValidate: true })
    }
    if (result.state) {
      form.setValue("state", result.state, { shouldValidate: true })
    }
  }

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="cep"
        render={({ field }) => (
          <FormItem>
            <FormLabel>CEP</FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  placeholder="00000-000"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={9}
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(maskCep(e.target.value))}
                  onBlur={(e) => {
                    field.onBlur()
                    void onCepBlur(cepDigits(e.target.value))
                  }}
                />
                {lookingUp ? (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
                ) : null}
              </div>
            </FormControl>
            {lookupErr ? (
              <FormDescription className="text-destructive">
                {lookupErr}
              </FormDescription>
            ) : (
              <FormDescription>
                Preenchemos rua, bairro, cidade e estado automaticamente.
              </FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-[1fr_120px] gap-3">
        <FormField
          control={form.control}
          name="street"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rua / Logradouro</FormLabel>
              <FormControl>
                <Input
                  autoComplete="address-line1"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="streetNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número</FormLabel>
              <FormControl>
                <Input
                  inputMode="text"
                  placeholder="123"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="complement"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Complemento (opcional)</FormLabel>
            <FormControl>
              <Input
                placeholder="Sala, andar, ponto de referência..."
                autoComplete="address-line2"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="neighborhood"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bairro</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-[1fr_80px] gap-3">
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cidade</FormLabel>
              <FormControl>
                <Input
                  autoComplete="address-level2"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>UF</FormLabel>
              <FormControl>
                <Input
                  placeholder="SP"
                  maxLength={2}
                  autoComplete="address-level1"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(e.target.value.toUpperCase().slice(0, 2))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
