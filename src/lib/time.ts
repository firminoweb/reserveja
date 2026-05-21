import { addMinutes, format, parse, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { fromZonedTime, toZonedTime, formatInTimeZone } from "date-fns-tz"

/**
 * Converte minutos-desde-meia-noite + dia local + timezone → Date UTC.
 * Ex.: minutesToUtc(new Date('2026-05-17'), 540, 'America/Sao_Paulo')
 *      → 09:00 BRT = 12:00 UTC desse dia
 */
export function minutesToUtc(localDay: Date, minutes: number, timezone: string): Date {
  const dayStart = startOfDay(toZonedTime(localDay, timezone))
  const local = addMinutes(dayStart, minutes)
  return fromZonedTime(local, timezone)
}

/** Formata um instante UTC no fuso do estabelecimento (pt-BR por padrão). */
export function formatLocal(date: Date, timezone: string, pattern = "HH:mm"): string {
  return formatInTimeZone(date, timezone, pattern, { locale: ptBR })
}

/** Dia da semana (0=domingo) no fuso do estabelecimento. */
export function localWeekday(date: Date, timezone: string): number {
  return toZonedTime(date, timezone).getDay()
}

/** Parse de string "YYYY-MM-DD" no fuso do estabelecimento → Date no início do dia em UTC. */
export function parseLocalDateString(input: string, timezone: string): Date {
  const local = parse(input, "yyyy-MM-dd", new Date())
  return fromZonedTime(startOfDay(local), timezone)
}

/** Minutos desde meia-noite no fuso, dado um instante UTC. */
export function localMinutes(date: Date, timezone: string): number {
  const local = toZonedTime(date, timezone)
  return local.getHours() * 60 + local.getMinutes()
}

export { format, addMinutes, startOfDay }
