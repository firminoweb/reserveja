"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, LogOut } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { signOutAction } from "@/app/(panel)/painel/_actions"
import { cn } from "@/lib/utils"

type NavItem = { href: string; label: string }

type Props = {
  navItems: NavItem[]
  userEmail: string
}

export function AdminMobileNav({ navItems, userEmail }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Abrir menu"
          className="md:hidden text-slate-100 hover:bg-slate-800 hover:text-white"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-72 p-0 flex flex-col bg-slate-950 text-slate-100 border-slate-800"
      >
        <SheetHeader className="px-5 py-5 border-b border-slate-800">
          <SheetTitle className="text-left text-lg font-bold text-white">
            Reserve Já
          </SheetTitle>
          <p className="text-xs text-slate-400">Admin</p>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1 text-sm">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(`${item.href}/`))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block px-3 py-2 rounded-md transition-colors",
                  active
                    ? "bg-slate-800 text-white font-medium"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-3 border-t border-slate-800">
          <div className="text-xs text-slate-400 mb-2 truncate px-2">
            {userEmail}
          </div>
          <form action={signOutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-slate-200 hover:bg-slate-800 hover:text-white"
            >
              <LogOut className="size-4" />
              Sair
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
