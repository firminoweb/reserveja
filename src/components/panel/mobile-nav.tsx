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
import { Logo } from "@/components/ui/logo"
import { UnitSelector } from "@/components/panel/unit-selector"
import { signOutAction } from "@/app/(panel)/painel/_actions"

type NavItem = { href: string; label: string }
type Unit = { id: string; name: string; slug: string }

type Props = {
  navItems: NavItem[]
  organizationName: string
  currentUnit: Unit
  units: Unit[]
  userEmail: string
}

export function MobileNav({
  navItems,
  organizationName,
  currentUnit,
  units,
  userEmail,
}: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Abrir menu"
          className="md:hidden"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-3 border-b">
          <SheetTitle className="text-left">
            <Logo iconClassName="size-8" textClassName="text-base" />
          </SheetTitle>
          <div className="mt-2">
            <UnitSelector
              organizationName={organizationName}
              current={currentUnit}
              units={units}
            />
          </div>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1 text-sm">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/painel" && pathname.startsWith(`${item.href}/`))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2 rounded-md transition-colors ${
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground/80 hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-3 border-t">
          <div className="text-xs text-muted-foreground mb-2 truncate px-2">
            {userEmail}
          </div>
          <form action={signOutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start"
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
