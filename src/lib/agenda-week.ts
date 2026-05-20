import { addDays, startOfWeek } from "date-fns"
import { fromZonedTime, toZonedTime } from "date-fns-tz"

export type TimeBlockInput = {
  id: string
  startsAt: Date
  endsAt: Date
  reason: string | null
  professional: { id: string; name: string } | null
}

export type DayBlockSegment = {
  id: string
  /** Minutos a partir da meia-noite local do dia (0 quando começa antes). */
  localStartMin: number
  /** Minutos até o fim do segmento (até 1440 quando termina depois). */
  localEndMin: number
  reason: string | null
  professionalName: string | null
}

/**
 * Helpers de agenda semanal. Tudo gira no fuso do estabelecimento: input/output
 * de range é em UTC pra consultas DB, mas a "semana" é definida no horário
 * local (segunda 00:00 → segunda+7 00:00).
 */

export type WeekRange = {
  /** Segunda às 00:00 no fuso local, convertido pra UTC. */
  startUtc: Date
  /** Próxima segunda às 00:00 no fuso local, convertido pra UTC (exclusivo). */
  endUtc: Date
  /** Segunda às 00:00 já no fuso local (Date com clock local). Pra exibir. */
  startLocal: Date
}

/** Calcula a faixa Mon-Sun da semana que contém o anchor (em UTC). */
export function getWeekRange(anchorUtc: Date, timezone: string): WeekRange {
  const local = toZonedTime(anchorUtc, timezone)
  const mondayLocal = startOfWeek(local, { weekStartsOn: 1 })
  const startUtc = fromZonedTime(mondayLocal, timezone)
  const nextMondayLocal = addDays(mondayLocal, 7)
  const endUtc = fromZonedTime(nextMondayLocal, timezone)
  return { startUtc, endUtc, startLocal: mondayLocal }
}

/** Retorna os 7 dias da semana (segunda...domingo) no fuso local. */
export function weekDaysLocal(startLocal: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(startLocal, i))
}

/**
 * Assina cada booking a uma "lane" pra renderizar sobreposições lado-a-lado.
 * Lanes ficam dentro de uma mesma coluna do dia (não cruzam dias).
 *
 * Algoritmo: ordena por startsAt; cada booking pega a primeira lane cujo
 * último end seja <= seu start. Se nenhuma, cria nova lane.
 *
 * Retorna `totalLanes` = nº de lanes usadas no dia inteiro. Pra cálculo de
 * largura/posição na UI.
 */
export function assignLanes<
  B extends { startsAt: Date; endsAt: Date },
>(bookings: B[]): { items: Array<B & { lane: number }>; totalLanes: number } {
  const sorted = [...bookings].sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
  )
  const lanesEnd: Date[] = []
  const items: Array<B & { lane: number }> = []

  for (const b of sorted) {
    let lane = lanesEnd.findIndex((end) => end.getTime() <= b.startsAt.getTime())
    if (lane === -1) {
      lane = lanesEnd.length
      lanesEnd.push(b.endsAt)
    } else {
      lanesEnd[lane] = b.endsAt
    }
    items.push({ ...b, lane })
  }

  return { items, totalLanes: lanesEnd.length || 1 }
}

/** Range [start, end) em minutos com base nas working hours do estabelecimento.
 *  Se não houver, default 8h-20h. */
export function workingHoursMinuteRange(
  workingHours: Array<{ startMin: number; endMin: number }>,
): { startMin: number; endMin: number } {
  if (workingHours.length === 0) return { startMin: 8 * 60, endMin: 20 * 60 }
  const startMin = Math.min(...workingHours.map((w) => w.startMin))
  const endMin = Math.max(...workingHours.map((w) => w.endMin))
  return { startMin, endMin }
}

/** Formata minutos desde meia-noite (0-1440) como HH:MM. */
export function minutesToHHMM(min: number): string {
  const clamped = Math.max(0, Math.min(1440, Math.round(min)))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

/** Cor estável por id (hue 0-360 baseado em hash simples). */
export function hueFromId(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return Math.abs(hash) % 360
}

/**
 * Corta blocks pra segmentos diários. Um block pode atravessar vários dias —
 * cada dia recebe a porção que cobre, com offsets em minutos relativos à
 * meia-noite local daquele dia.
 *
 * `daysLocal` deve estar ordenado (segunda → domingo) e cada Date é a
 * meia-noite local do respectivo dia (mesmo formato de `weekDaysLocal`).
 */
export function splitBlocksByDay(
  blocks: TimeBlockInput[],
  daysLocal: Date[],
  timezone: string,
): Map<string, DayBlockSegment[]> {
  const result = new Map<string, DayBlockSegment[]>()
  for (const day of daysLocal) {
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`
    const dayStartUtc = fromZonedTime(day, timezone)
    const dayEndUtc = fromZonedTime(addDays(day, 1), timezone)
    const segs: DayBlockSegment[] = []
    for (const b of blocks) {
      const overlapStart = Math.max(b.startsAt.getTime(), dayStartUtc.getTime())
      const overlapEnd = Math.min(b.endsAt.getTime(), dayEndUtc.getTime())
      if (overlapEnd <= overlapStart) continue
      segs.push({
        id: b.id,
        localStartMin: Math.round((overlapStart - dayStartUtc.getTime()) / 60_000),
        localEndMin: Math.round((overlapEnd - dayStartUtc.getTime()) / 60_000),
        reason: b.reason,
        professionalName: b.professional?.name ?? null,
      })
    }
    result.set(key, segs)
  }
  return result
}
