"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

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
import { BUSINESS_CATEGORY_OPTIONS } from "@/lib/business-categories"
import { maskTaxId } from "@/lib/tax"
import {
  updateOrganizationSchema,
  type UpdateOrganizationInput,
} from "@/lib/validations/organization"
import { updateOrganizationAction } from "@/app/(panel)/painel/configuracoes/actions"

type Props = {
  initial: { name: string; category: UpdateOrganizationInput["category"]; taxId: string | null }
}

export function OrganizationForm({ initial }: Props) {
  const router = useRouter()
  const form = useForm<UpdateOrganizationInput>({
    resolver: zodResolver(updateOrganizationSchema),
    defaultValues: {
      name: initial.name,
      category: initial.category,
      taxId: initial.taxId ? maskTaxId(initial.taxId) : "",
    },
  })

  async function onSubmit(values: UpdateOrganizationInput) {
    const res = await updateOrganizationAction(values)
    if (!res.ok) {
      if (res.field) form.setError(res.field, { message: res.message })
      else toast.error(res.message)
      return
    }
    toast.success("Empresa atualizada")
    router.refresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-5 max-w-xl">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da empresa</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>Razão social ou nome da marca.</FormDescription>
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
          name="taxId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPF / CNPJ</FormLabel>
              <FormControl>
                <Input
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  inputMode="numeric"
                  {...field}
                  onChange={(e) => field.onChange(maskTaxId(e.target.value))}
                />
              </FormControl>
              <FormDescription>Usado pra emissão de nota fiscal.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Salvando..." : "Salvar empresa"}
        </Button>
      </form>
    </Form>
  )
}
