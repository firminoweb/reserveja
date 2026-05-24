"use client"

import { CalendarPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  googleCalendarUrl,
  outlookCalendarUrl,
  type CalendarEvent,
} from "@/lib/calendar-links"

type Props = {
  event: CalendarEvent
  icsUrl: string
}

export function AddToCalendarMenu({ event, icsUrl }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="lg" className="w-full gap-2">
          <CalendarPlus className="size-4" />
          Adicionar ao calendário
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-(--radix-dropdown-menu-trigger-width)">
        <DropdownMenuItem asChild>
          <a
            href={googleCalendarUrl(event)}
            target="_blank"
            rel="noreferrer"
            className="cursor-pointer"
          >
            Google Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={icsUrl} download className="cursor-pointer">
            Apple Calendar (.ics)
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={outlookCalendarUrl(event)}
            target="_blank"
            rel="noreferrer"
            className="cursor-pointer"
          >
            Outlook
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
