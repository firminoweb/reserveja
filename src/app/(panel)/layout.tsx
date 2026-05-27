import Link from "next/link"

import { requireOwnerMembership } from "@/server/auth/guards"
import { downgradeExpiredPlans } from "@/server/billing/cancel"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { UnitSelector } from "@/components/panel/unit-selector"
import { MobileNav } from "@/components/panel/mobile-nav"
import { SiteFooter } from "@/components/site/site-footer"
import { ImpersonationBanner } from "@/components/admin/impersonation-banner"
import { signOutAction } from "@/app/(panel)/painel/_actions"

const NAV: Array<{ href: string; label: string; ownerOnly?: boolean }> = [
  { href: "/painel", label: "Hoje" },
  { href: "/painel/agenda", label: "Agenda" },
  { href: "/painel/servicos", label: "Serviços" },
  { href: "/painel/profissionais", label: "Profissionais" },
  { href: "/painel/horarios", label: "Horários" },
  { href: "/painel/bloqueios", label: "Bloqueios" },
  { href: "/painel/clientes", label: "Clientes" },
  { href: "/painel/historico", label: "Histórico" },
  { href: "/painel/unidades", label: "Unidades" },
  { href: "/painel/equipe", label: "Equipe", ownerOnly: true },
  { href: "/painel/plano", label: "Plano", ownerOnly: true },
  { href: "/painel/configuracoes", label: "Configurações", ownerOnly: true },
]

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { session, organization, establishment, establishments, role } =
    await requireOwnerMembership()

  if (
    organization.plan !== "FREE" &&
    organization.planExpiresAt &&
    organization.planExpiresAt <= new Date() &&
    !organization.asaasSubscriptionId
  ) {
    await downgradeExpiredPlans()
  }

  const navItems = NAV.filter((item) => !item.ownerOnly || role === "OWNER")
  const units = establishments.map((e) => ({
    id: e.id,
    name: e.name,
    slug: e.slug,
  }))

  const impersonatedBy = session.impersonatedBy

  return (
    <div className="flex min-h-svh flex-col">
      {impersonatedBy ? (
        <ImpersonationBanner
          impersonatedName={session.user.name}
          impersonatedEmail={session.user.email}
          adminName={impersonatedBy.name || impersonatedBy.email}
        />
      ) : null}
      <div className="flex flex-1 flex-col md:flex-row">
      {/* Header mobile (só <md) */}
      <header className="md:hidden flex items-center gap-2 border-b bg-background sticky top-0 z-30 px-3 h-14">
        <MobileNav
          navItems={navItems.map(({ href, label }) => ({ href, label }))}
          organizationName={organization.name}
          currentUnit={{
            id: establishment.id,
            name: establishment.name,
            slug: establishment.slug,
          }}
          units={units}
          userEmail={session.user.email ?? ""}
        />
        <Link href="/painel" aria-label="Painel — início" className="shrink-0">
          <Logo iconClassName="size-8" textClassName="text-base" />
        </Link>
        <div className="ml-auto text-xs text-muted-foreground truncate max-w-[40%]">
          {establishment.name}
        </div>
      </header>

      {/* Sidebar desktop (≥md) */}
      <aside className="hidden md:flex w-60 flex-col border-r bg-muted/30">
        <div className="px-3 pt-4 pb-3 border-b">
          <Link
            href="/painel"
            aria-label="Painel — início"
            className="px-2 block"
          >
            <Logo iconClassName="size-8" textClassName="text-base" />
          </Link>
          <div className="mt-3">
            <UnitSelector
              organizationName={organization.name}
              current={establishment}
              units={units}
            />
          </div>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-md hover:bg-primary/10 hover:text-primary text-foreground/80 font-medium transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-3 border-t">
          <div className="text-xs text-muted-foreground mb-2 truncate px-2">
            {session.user.email}
          </div>
          <form action={signOutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start"
            >
              Sair
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
      </div>
    </div>
  )
}
