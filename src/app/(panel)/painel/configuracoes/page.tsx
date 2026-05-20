import Link from "next/link"

import { requireOwnerRole } from "@/server/auth/guards"
import { Separator } from "@/components/ui/separator"
import { OrganizationForm } from "@/components/panel/organization-form"
import { SettingsForm } from "@/components/panel/settings-form"

export default async function PanelConfigPage() {
  const { organization, establishment } = await requireOwnerRole()

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-2xl">
      <h1 className="text-2xl font-bold">Configurações</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Endereço público:{" "}
        <Link
          href={`/${establishment.slug}`}
          className="font-mono underline"
          target="_blank"
        >
          /{establishment.slug}
        </Link>
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Empresa</h2>
        <p className="text-sm text-muted-foreground">
          Dados que se aplicam a todas as unidades.
        </p>
        <OrganizationForm
          initial={{
            name: organization.name,
            category: organization.category,
            taxId: organization.taxId,
          }}
        />
      </section>

      <Separator className="my-10" />

      <section>
        <h2 className="text-lg font-semibold">Unidade — {establishment.name}</h2>
        <p className="text-sm text-muted-foreground">
          Aparece pra cliente: nome, descrição, WhatsApp da unidade.
        </p>
        <SettingsForm
          initial={{
            name: establishment.name,
            description: establishment.description,
            whatsapp: establishment.whatsapp,
            timezone: establishment.timezone,
            logoUrl: establishment.logoUrl,
            coverUrl: establishment.coverUrl,
            cep: establishment.cep,
            street: establishment.street,
            streetNumber: establishment.streetNumber,
            complement: establishment.complement,
            neighborhood: establishment.neighborhood,
            city: establishment.city,
            state: establishment.state,
          }}
        />
      </section>
    </div>
  )
}
