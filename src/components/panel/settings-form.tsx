"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { formatNationalBR, maskBR } from "@/lib/phone"
import Image from "next/image"

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
import { AddressFields } from "@/components/ui/address-fields"
import { maskCep } from "@/lib/viacep"
import {
  updateEstablishmentSchema,
  type UpdateEstablishmentInput,
} from "@/lib/validations/establishment"
import { updateEstablishmentAction } from "@/app/(panel)/painel/configuracoes/actions"

const TIMEZONES = [
  "America/Sao_Paulo",
  "America/Bahia",
  "America/Fortaleza",
  "America/Recife",
  "America/Belem",
  "America/Manaus",
  "America/Cuiaba",
  "America/Boa_Vista",
  "America/Porto_Velho",
  "America/Rio_Branco",
  "America/Noronha",
] as const

type Props = {
  initial: {
    name: string
    description: string | null
    whatsapp: string
    timezone: string
    logoUrl: string | null
    coverUrl: string | null
    cep: string | null
    street: string | null
    streetNumber: string | null
    complement: string | null
    neighborhood: string | null
    city: string | null
    state: string | null
  }
}

export function SettingsForm({ initial }: Props) {
  const router = useRouter()
  const tzOptions = TIMEZONES.includes(initial.timezone as (typeof TIMEZONES)[number])
    ? TIMEZONES
    : ([...TIMEZONES, initial.timezone] as readonly string[])

  const form = useForm<UpdateEstablishmentInput>({
    resolver: zodResolver(updateEstablishmentSchema),
    defaultValues: {
      name: initial.name,
      description: initial.description ?? "",
      whatsapp: formatNationalBR(initial.whatsapp),
      timezone: initial.timezone,
      logoUrl: initial.logoUrl ?? "",
      coverUrl: initial.coverUrl ?? "",
      cep: initial.cep ? maskCep(initial.cep) : "",
      street: initial.street ?? "",
      streetNumber: initial.streetNumber ?? "",
      complement: initial.complement ?? "",
      neighborhood: initial.neighborhood ?? "",
      city: initial.city ?? "",
      state: initial.state ?? "",
    },
  })

  async function onSubmit(values: UpdateEstablishmentInput) {
    const res = await updateEstablishmentAction(values)
    if (!res.ok) {
      if (res.field) form.setError(res.field, { message: res.message })
      else toast.error(res.message)
      return
    }
    toast.success("Configurações salvas")
    router.refresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-5 max-w-xl">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do salão</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Aparece na página pública" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="whatsapp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>WhatsApp</FormLabel>
              <FormControl>
                <Input
                  inputMode="tel"
                  autoComplete="tel"
                  {...field}
                  onChange={(e) => field.onChange(maskBR(e.target.value))}
                />
              </FormControl>
              <FormDescription>Cliente clica direto pra falar com o salão.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fuso horário</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                >
                  {tzOptions.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormDescription>
                Afeta como horários são exibidos pros clientes.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4">
          <FormField
            control={form.control}
            name="logoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL do logo</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." {...field} />
                </FormControl>
                <FormDescription>
                  Cole um link público (Cloudinary, Imgur, S3 etc.). Upload integrado vem depois.
                </FormDescription>
                {field.value ? (
                  <Image
                    src={field.value}
                    alt="Preview do logo"
                    width={64}
                    height={64}
                    unoptimized
                    className="mt-2 size-16 rounded-md object-cover border"
                  />
                ) : null}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="coverUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL da capa</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." {...field} />
                </FormControl>
                {field.value ? (
                  <Image
                    src={field.value}
                    alt="Preview da capa"
                    width={400}
                    height={120}
                    unoptimized
                    className="mt-2 h-24 w-full rounded-md object-cover border"
                  />
                ) : null}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="pt-2 border-t">
          <h3 className="text-sm font-semibold mb-1">Endereço</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Aparece na vitrine pública com link pro Google Maps. Preencha tudo
            ou deixe em branco — campos parciais não são exibidos.
          </p>
          <AddressFields />
        </div>

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </Form>
  )
}
