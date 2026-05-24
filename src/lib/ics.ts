import { formatInTimeZone } from "date-fns-tz"

// RFC 5545 (iCalendar). Funciona em Google Calendar, Apple Calendar e Outlook.
// Mantemos UID estável (booking.publicToken) — METHOD:CANCEL com mesmo UID +
// SEQUENCE > 0 remove o evento do calendário do cliente automaticamente.

export type IcsMethod = "PUBLISH" | "REQUEST" | "CANCEL"

export type IcsInput = {
  uid: string
  sequence?: number
  method?: IcsMethod
  startsAt: Date
  endsAt: Date
  timezone: string
  summary: string
  description: string
  location?: string
  url?: string
  organizerEmail?: string
  organizerName?: string
  attendeeEmail: string
  attendeeName: string
  alarmMinutesBefore?: number // default 30
}

// Escape de TEXT (RFC 5545 §3.3.11): \ , ; e quebras de linha
function esc(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\r?\n/g, "\\n")
}

// UTC com sufixo Z — usado em DTSTAMP
function utc(d: Date): string {
  return formatInTimeZone(d, "UTC", "yyyyMMdd'T'HHmmss'Z'")
}

// Horário local sem Z — usado em DTSTART/DTEND com TZID
function local(d: Date, tz: string): string {
  return formatInTimeZone(d, tz, "yyyyMMdd'T'HHmmss")
}

// Linhas > 75 octets devem ser dobradas com CRLF + espaço (RFC 5545 §3.1)
function fold(line: string): string {
  if (line.length <= 75) return line
  const out: string[] = []
  let i = 0
  while (i < line.length) {
    out.push((i === 0 ? "" : " ") + line.slice(i, i === 0 ? 75 : i + 74))
    i += i === 0 ? 75 : 74
  }
  return out.join("\r\n")
}

export function buildIcs(input: IcsInput): string {
  const method = input.method ?? "REQUEST"
  const alarm = input.alarmMinutesBefore ?? 30
  const now = new Date()

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Reserve Ja//Booking//PT-BR",
    "CALSCALE:GREGORIAN",
    `METHOD:${method}`,
    "BEGIN:VEVENT",
    `UID:${input.uid}@reserveja.app`,
    `SEQUENCE:${input.sequence ?? 0}`,
    `DTSTAMP:${utc(now)}`,
    `DTSTART;TZID=${input.timezone}:${local(input.startsAt, input.timezone)}`,
    `DTEND;TZID=${input.timezone}:${local(input.endsAt, input.timezone)}`,
    `SUMMARY:${esc(input.summary)}`,
    `DESCRIPTION:${esc(input.description)}`,
  ]

  if (input.location) lines.push(`LOCATION:${esc(input.location)}`)
  if (input.url) lines.push(`URL:${input.url}`)
  if (input.organizerEmail) {
    const cn = input.organizerName ? `;CN=${esc(input.organizerName)}` : ""
    lines.push(`ORGANIZER${cn}:mailto:${input.organizerEmail}`)
  }
  if (method !== "PUBLISH") {
    lines.push(
      `ATTENDEE;CN=${esc(input.attendeeName)};RSVP=FALSE:mailto:${input.attendeeEmail}`,
    )
  }
  lines.push(method === "CANCEL" ? "STATUS:CANCELLED" : "STATUS:CONFIRMED")
  lines.push("TRANSP:OPAQUE")

  if (method !== "CANCEL" && alarm > 0) {
    lines.push(
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:Lembrete do agendamento",
      `TRIGGER:-PT${alarm}M`,
      "END:VALARM",
    )
  }

  lines.push("END:VEVENT", "END:VCALENDAR")
  return lines.map(fold).join("\r\n") + "\r\n"
}
