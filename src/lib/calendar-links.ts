import { formatInTimeZone } from "date-fns-tz"

export type CalendarEvent = {
  title: string
  description?: string
  location?: string
  startsAt: Date
  endsAt: Date
}

function utcStamp(d: Date): string {
  return formatInTimeZone(d, "UTC", "yyyyMMdd'T'HHmmss'Z'")
}

function isoSeconds(d: Date): string {
  return formatInTimeZone(d, "UTC", "yyyy-MM-dd'T'HH:mm:ss'Z'")
}

export function googleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${utcStamp(event.startsAt)}/${utcStamp(event.endsAt)}`,
  })
  if (event.description) params.set("details", event.description)
  if (event.location) params.set("location", event.location)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function outlookCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.title,
    startdt: isoSeconds(event.startsAt),
    enddt: isoSeconds(event.endsAt),
  })
  if (event.description) params.set("body", event.description)
  if (event.location) params.set("location", event.location)
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}
