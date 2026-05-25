"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Building2, Check, Loader2, User, X } from "lucide-react"
import { maskBR } from "@/lib/phone"
import { maskCNPJ, maskCPF } from "@/lib/tax"
import { getCategoriesByType } from "@/lib/business-categories"

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
import { AddressFields } from "@/components/ui/address-fields"
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth"
import { slugify } from "@/lib/slug"
import { cn } from "@/lib/utils"
import { registerAction } from "./actions"

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid"

export function RegisterForm() {
  const [slugTouched, setSlugTouched] = useState(false)
  const [slugCheck, setSlugCheck] = useState<{ slug: string; available: boolean } | null>(null)

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      type: "EMPRESA",
      name: "",
      email: "",
      password: "",
      establishmentName: "",
      slug: "",
      whatsapp: "",
      category: "BARBEARIA",
      taxId: "",
      cep: "",
      street: "",
      streetNumber: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
    },
  })

  const orgType = useWatch({ control: form.control, name: "type" })
  const isEmpresa = orgType === "EMPRESA"
  const categories = useMemo(() => getCategoriesByType(orgType), [orgType])

  useEffect(() => {
    const current = form.getValues("category")
    const valid = categories.some((c) => c.value === current)
    if (!valid) {
      form.setValue("category", categories[0].value)
    }
    form.setValue("taxId", "")
  }, [orgType, categories, form])

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
        {/* Tipo de conta */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de conta</FormLabel>
              <FormControl>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => field.onChange("EMPRESA")}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors",
                      field.value === "EMPRESA"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <Building2 className="size-6" />
                    <span className="text-sm font-semibold">Empresa</span>
                    <span className="text-xs text-muted-foreground text-center">
                      Salão, barbearia, clínica, loja...
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => field.onChange("AUTONOMO")}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors",
                      field.value === "AUTONOMO"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <User className="size-6" />
                    <span className="text-sm font-semibold">Autônomo</span>
                    <span className="text-xs text-muted-foreground text-center">
                      Personal, nutricionista, fotógrafo...
                    </span>
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <div className="pt-4 border-t">
          <h2 className="text-sm font-semibold mb-3">
            {isEmpresa ? "Dados do negócio" : "Dados profissionais"}
          </h2>
        </div>

        <FormField
          control={form.control}
          name="establishmentName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isEmpresa ? "Nome do negócio" : "Nome profissional"}</FormLabel>
              <FormControl>
                <Input
                  placeholder={isEmpresa ? "Ex.: Barbearia do João" : "Ex.: João Fitness"}
                  {...field}
                />
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
              <FormLabel>Categoria</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="flex h-11 w-full rounded-md border border-input bg-transparent px-3.5 py-2 text-base shadow-xs focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/40 outline-none"
                >
                  {categories.map((o) => (
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
          name="taxId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isEmpresa ? "CNPJ" : "CPF"}</FormLabel>
              <FormControl>
                <Input
                  placeholder={isEmpresa ? "00.000.000/0000-00" : "000.000.000-00"}
                  inputMode="numeric"
                  {...field}
                  onChange={(e) =>
                    field.onChange(
                      isEmpresa ? maskCNPJ(e.target.value) : maskCPF(e.target.value),
                    )
                  }
                />
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
              <FormLabel>{isEmpresa ? "WhatsApp do negócio" : "Seu WhatsApp"}</FormLabel>
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

        <div className="pt-4 border-t">
          <h2 className="text-sm font-semibold mb-3">
            {isEmpresa ? "Endereço do estabelecimento" : "Endereço de atendimento"}
          </h2>
          <AddressFields />
        </div>

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
