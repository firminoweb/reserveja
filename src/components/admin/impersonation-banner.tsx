import { UserCog } from "lucide-react"

import { stopImpersonatingAction } from "@/app/(admin)/admin/_actions"
import { Button } from "@/components/ui/button"

type Props = {
  impersonatedName: string
  impersonatedEmail: string
  adminName: string
}

export function ImpersonationBanner({
  impersonatedName,
  impersonatedEmail,
  adminName,
}: Props) {
  return (
    <div className="sticky top-0 z-40 border-b bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-100">
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-2 flex items-center gap-3 text-sm">
        <UserCog className="size-4 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <span className="font-medium">{adminName}</span> impersonando{" "}
          <span className="font-medium">{impersonatedName}</span>{" "}
          <span className="text-amber-700 dark:text-amber-300 truncate">
            ({impersonatedEmail})
          </span>
        </div>
        <form action={stopImpersonatingAction}>
          <Button
            type="submit"
            size="sm"
            variant="outline"
            className="border-amber-300 bg-white hover:bg-amber-100 hover:border-amber-400 text-amber-900"
          >
            Voltar pra admin
          </Button>
        </form>
      </div>
    </div>
  )
}
