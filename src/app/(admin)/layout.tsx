import Link from "next/link"

import { requireRole } from "@/server/auth/guards"
import { signOut } from "@/lib/auth"
import { Button } from "@/components/ui/button"

const NAV = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/estabelecimentos", label: "Estabelecimentos" },
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/financeiro", label: "Financeiro" },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireRole("ADMIN")

  return (
    <div className="flex min-h-svh">
      <aside className="hidden md:flex w-60 flex-col border-r bg-slate-950 text-slate-100">
        <div className="px-5 py-5 border-b border-slate-800">
          <Link href="/admin" className="text-lg font-bold">Reserve Já</Link>
          <p className="mt-1 text-xs text-slate-400">Admin</p>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-1 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-3 border-t border-slate-800">
          <div className="text-xs text-slate-400 mb-2 truncate px-2">{session.user.email}</div>
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/" })
            }}
          >
            <Button type="submit" variant="ghost" size="sm" className="w-full justify-start text-slate-200 hover:bg-slate-800 hover:text-white">
              Sair
            </Button>
          </form>
        </div>
      </aside>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
