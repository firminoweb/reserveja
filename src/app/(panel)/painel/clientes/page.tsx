import { requireOwnerMembership } from "@/server/auth/guards"
import { listClientsForEstablishment } from "@/server/clients/list"
import { ClientsPanel } from "@/components/panel/clients-panel"

export default async function PanelClientesPage() {
  const { establishment } = await requireOwnerMembership()
  const clients = await listClientsForEstablishment(establishment.id)

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <span className="text-sm text-muted-foreground">
          {clients.length}{" "}
          {clients.length === 1 ? "cliente" : "clientes"}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Agrupados por telefone — mesmo número aparece como o mesmo cliente.
      </p>

      <div className="mt-6">
        <ClientsPanel clients={clients} timezone={establishment.timezone} />
      </div>
    </div>
  )
}
