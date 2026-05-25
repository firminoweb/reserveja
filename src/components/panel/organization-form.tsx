"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import type { OrgType } from "@prisma/client"

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
import { getCategoriesByType } from "@/lib/business-categories"
import { maskCNPJ, maskCPF, maskTaxId } from "@/lib/tax"
import {
  updateOrganizationSchema,
  type UpdateOrganizationInput,
} from "@/lib/validations/organization"
import { updateOrganizationAction } from "@/app/(panel)/painel/configuracoes/actions"

type Props = {
  orgType: OrgType
  initial: { name: string; category: UpdateOrganizationInput["category"]; taxId: string | null }
}

export function OrganizationForm({ orgType, initial }: Props) {
  const router = useRouter()
  const isEmpresa = orgType === "EMPRESA"
  const categories = useMemo(() => getCategoriesByType(orgType), [orgType])

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
    toast.success(isEmpresa ? "Empresa atualizada" : "Dados atualizados")
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
              <FormLabel>{isEmpresa ? "Nome da empresa" : "Nome profissional"}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                {isEmpresa ? "Razão social ou nome da marca." : "Como você quer ser encontrado."}
              </FormDescription>
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
                    field.onChange(isEmpresa ? maskCNPJ(e.target.value) : maskCPF(e.target.value))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </Form>
  )
}
