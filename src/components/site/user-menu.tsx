"use client"

import Link from "next/link"
import { LayoutDashboard, LogOut, Shield } from "lucide-react"

import { signOutAction } from "@/app/(panel)/painel/_actions"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Props = {
  name: string | null
  email: string
  role: "ADMIN" | "OWNER"
}

function initials(name: string | null, email: string) {
  const src = (name?.trim() || email).trim()
  const parts = src.split(/[\s@.]+/).filter(Boolean)
  const first = parts[0]?.charAt(0) ?? "?"
  const second = parts.length > 1 ? parts[parts.length - 1].charAt(0) : ""
  return (first + second).toUpperCase()
}

export function UserMenu({ name, email, role }: Props) {
  const isAdmin = role === "ADMIN"
  const dashboardHref = isAdmin ? "/admin" : "/painel"
  const dashboardLabel = isAdmin ? "Painel admin" : "Ir para o painel"
  const DashboardIcon = isAdmin ? Shield : LayoutDashboard

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="md:h-10 gap-2 pl-1.5 pr-2.5"
          aria-label="Menu da conta"
        >
          <span className="size-7 md:size-8 rounded-full bg-primary text-primary-foreground text-xs md:text-sm font-semibold flex items-center justify-center">
            {initials(name, email)}
          </span>
          <span className="hidden sm:inline max-w-[140px] truncate text-sm font-medium">
            {name || email}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate font-medium">{name || "Sua conta"}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={dashboardHref} className="cursor-pointer">
            <DashboardIcon className="size-4" />
            {dashboardLabel}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="text-destructive focus:text-destructive">
          <form action={signOutAction} className="w-full">
            <button type="submit" className="flex w-full items-center gap-2 cursor-pointer">
              <LogOut className="size-4" />
              Sair
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
