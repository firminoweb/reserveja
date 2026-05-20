import Link from "next/link"

import { requireOwnerMembership } from "@/server/auth/guards"
import { signOut } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { UnitSelector } from "@/components/panel/unit-selector"

const NAV: Array<{ href: string; label: string; ownerOnly?: boolean }> = [
  { href: "/painel", label: "Hoje" },
  { href: "/painel/agenda", label: "Agenda" },
  { href: "/painel/servicos", label: "Serviços" },
  { href: "/painel/profissionais", label: "Profissionais" },
  { href: "/painel/horarios", label: "Horários" },
  { href: "/painel/bloqueios", label: "Bloqueios" },
  { href: "/painel/clientes", label: "Clientes" },
  { href: "/painel/unidades", label: "Unidades" },
  { href: "/painel/equipe", label: "Equipe", ownerOnly: true },
  { href: "/painel/configuracoes", label: "Configurações", ownerOnly: true },
]

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { session, organization, establishment, establishments, role } =
    await requireOwnerMembership()

  const navItems = NAV.filter((item) => !item.ownerOnly || role === "OWNER")

  return (
    <div className="flex min-h-svh">
      <aside className="hidden md:flex w-60 flex-col border-r bg-muted/30">
        <div className="px-3 pt-4 pb-3 border-b">
          <Link href="/painel" className="px-2 text-lg font-bold block">
            Reserve Já
          </Link>
          <div className="mt-2">
            <UnitSelector
              organizationName={organization.name}
              current={establishment}
              units={establishments.map((e) => ({
                id: e.id,
                name: e.name,
                slug: e.slug,
              }))}
            />
          </div>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-1 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-md hover:bg-muted text-foreground/80 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-3 border-t">
          <div className="text-xs text-muted-foreground mb-2 truncate px-2">{session.user.email}</div>
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/" })
            }}
          >
            <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
              Sair
            </Button>
          </form>
        </div>
      </aside>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
