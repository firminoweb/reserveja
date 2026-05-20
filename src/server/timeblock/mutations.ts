import { db } from "@/lib/db"
import { minutesToUtc, parseLocalDateString } from "@/lib/time"
import type { CreateTimeBlockInput } from "@/lib/validations/time-block"

export class TimeBlockError extends Error {
  constructor(public code: "NOT_FOUND" | "INVALID_RANGE" | "PROFESSIONAL_INVALID", message: string) {
    super(message)
  }
}

function hhmmToMinutes(s: string): number {
  const [h, m] = s.split(":").map((n) => parseInt(n, 10))
  return h * 60 + m
}

export async function createTimeBlock(
  establishmentId: string,
  input: CreateTimeBlockInput,
) {
  const establishment = await db.establishment.findUnique({
    where: { id: establishmentId },
    select: { timezone: true },
  })
  if (!establishment) throw new TimeBlockError("NOT_FOUND", "Estabelecimento não encontrado")

  if (input.professionalId) {
    const pro = await db.professional.findFirst({
      where: { id: input.professionalId, establishmentId },
      select: { id: true },
    })
    if (!pro) throw new TimeBlockError("PROFESSIONAL_INVALID", "Profissional inválido")
  }

  const startMin = hhmmToMinutes(input.startTime)
  const endMin = hhmmToMinutes(input.endTime)
  if (endMin <= startMin) {
    throw new TimeBlockError("INVALID_RANGE", "Fim deve ser depois do início")
  }

  const dayUtc = parseLocalDateString(input.date, establishment.timezone)
  const startsAt = minutesToUtc(dayUtc, startMin, establishment.timezone)
  const endsAt = minutesToUtc(dayUtc, endMin, establishment.timezone)

  return db.timeBlock.create({
    data: {
      establishmentId,
      professionalId: input.professionalId || null,
      startsAt,
      endsAt,
      reason: input.reason?.trim() || null,
    },
  })
}

export async function deleteTimeBlock(establishmentId: string, blockId: string) {
  const existing = await db.timeBlock.findFirst({
    where: { id: blockId, establishmentId },
    select: { id: true },
  })
  if (!existing) throw new TimeBlockError("NOT_FOUND", "Bloqueio não encontrado")
  await db.timeBlock.delete({ where: { id: blockId } })
}
