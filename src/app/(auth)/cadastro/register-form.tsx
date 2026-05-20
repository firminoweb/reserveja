"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { maskBR } from "@/lib/phone"
import { maskTaxId } from "@/lib/tax"
import { BUSINESS_CATEGORY_OPTIONS } from "@/lib/business-categories"
import { Check, Loader2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { PasswordStrength } from "@/components/ui/password-strength"
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth"
import { slugify } from "@/lib/slug"
import { registerAction } from "./actions"

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid"

export function RegisterForm() {
  const [slugTouched, setSlugTouched] = useState(false)
  const [slugCheck, setSlugCheck] = useState<{ slug: string; available: boolean } | null>(null)

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      establishmentName: "",
      slug: "",
      whatsapp: "",
      category: "BARBEARIA",
      taxId: "",
    },
  })

  const establishmentName = useWatch({
    control: form.control,
    name: "establishmentName",
  })
  useEffect(() => {
    if (!slugTouched) {
      form.setValue("slug", slugify(establishmentName), { shouldValidate: false })
    }
  }, [establishmentName, slugTouched, form])

  const password = useWatch({ control: form.control, name: "password" })
  const slug = useWatch({ control: form.control, name: "slug" })
  // Status sai de slug atual + último resultado do servidor. Evita setState
  // síncrono em useEffect (eslint react-hooks/set-state-in-effect).
  const slugStatus = useMemo<SlugStatus>(() => {
    if (!slug) return "idle"
    if (slug.length < 3) return "invalid"
    if (slugCheck?.slug === slug) return slugCheck.available ? "available" : "taken"
    return "checking"
  }, [slug, slugCheck])

  useEffect(() => {
    if (!slug || slug.length < 3) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/establishments/check-slug?slug=${encodeURIComponent(slug)}`,
          { signal: controller.signal },
        )
        const json = (await res.json()) as { available: boolean }
        setSlugCheck({ slug, available: json.available })
      } catch (err) {
        if ((err as Error).name !== "AbortError") setSlugCheck(null)
      }
    }, 350)
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [slug])

  async function onSubmit(values: SignUpInput) {
    if (slugStatus === "taken") {
      form.setError("slug", { message: "Esse endereço já está em uso" })
      return
    }
    const res = await registerAction(values)
    if (!res.ok) {
      if (res.field) form.setError(res.field, { message: res.message })
      else toast.error(res.message)
      return
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Seu nome</FormLabel>
              <FormControl>
                <Input autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <PasswordStrength password={password ?? ""} />
              <FormDescription>Pelo menos 8 caracteres.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="establishmentName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do salão</FormLabel>
              <FormControl>
                <Input placeholder="Ex.: Barbearia do João" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria do negócio</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="flex h-11 w-full rounded-md border border-input bg-transparent px-3.5 py-2 text-base shadow-xs focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/40 outline-none"
                >
                  {BUSINESS_CATEGORY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço público</FormLabel>
              <FormControl>
                <div
                  className="flex items-stretch border rounded-md focus-within:ring-3 focus-within:ring-ring/50 aria-invalid:border-destructive"
                  aria-invalid={slugStatus === "taken" || undefined}
                >
                  <span className="px-3 py-2 text-sm bg-muted text-muted-foreground rounded-l-md select-none">
                    reserveja.app/
                  </span>
                  <Input
                    {...field}
                    onChange={(e) => {
                      setSlugTouched(true)
                      field.onChange(slugify(e.target.value))
                    }}
                    className="border-0 rounded-none shadow-none focus-visible:ring-0"
                  />
                  <span className="px-3 flex items-center text-muted-foreground">
                    {slugStatus === "checking" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : slugStatus === "available" ? (
                      <Check className="size-4 text-emerald-600" />
                    ) : slugStatus === "taken" ? (
                      <X className="size-4 text-destructive" />
                    ) : null}
                  </span>
                </div>
              </FormControl>
              <FormDescription>
                {slugStatus === "taken" ? (
                  <span className="text-destructive">
                    Esse endereço já está em uso. Escolha outro.
                  </span>
                ) : slugStatus === "available" ? (
                  <span className="text-emerald-600">Disponível!</span>
                ) : (
                  "Seus clientes vão usar esse link pra agendar."
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="whatsapp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>WhatsApp do salão</FormLabel>
              <FormControl>
                <Input
                  placeholder="(11) 98765-4321"
                  inputMode="tel"
                  autoComplete="tel"
                  {...field}
                  onChange={(e) => field.onChange(maskBR(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="taxId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPF ou CNPJ (opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  inputMode="numeric"
                  {...field}
                  onChange={(e) => field.onChange(maskTaxId(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Pode preencher depois — usaremos pra emitir nota fiscal da mensalidade.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={
            form.formState.isSubmitting ||
            slugStatus === "checking" ||
            slugStatus === "taken"
          }
        >
          {form.formState.isSubmitting ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>
    </Form>
  )
}
