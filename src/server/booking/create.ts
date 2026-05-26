import { randomBytes } from "node:crypto"
import { addMinutes } from "date-fns"

import { db } from "@/lib/db"
import type { CreateBookingInput } from "@/lib/validations/booking"

export class BookingError extends Error {
  constructor(public code: "ESTABLISHMENT_NOT_FOUND" | "SERVICE_NOT_FOUND" | "PROFESSIONAL_NOT_FOUND" | "SLOT_TAKEN" | "PLAN_LIMIT" | "INVALID", message: string) {
    super(message)
  }
}

function newPublicToken(): string {
  return randomBytes(24).toString("base64url")
}

/**
 * Cria um booking de forma transacional. A constraint EXCLUDE no DB (migration
 * manual) impede sobreposição entre dois bookings CONFIRMED/PENDING pro mesmo
 * profissional, então não precisamos de SELECT FOR UPDATE aqui — o INSERT falha
 * se houver conflito.
 */
export async function createBooking(input: CreateBookingInput) {
  const establishment = await db.establishment.findFirst({
    where: {
      slug: input.establishmentSlug,
      organization: { status: { not: "SUSPENDED" } },
    },
    include: {
      organization: {
        select: { planLimitBookingsPerMonth: true },
      },
    },
  })
  if (!establishment) {
    throw new BookingError("ESTABLISHMENT_NOT_FOUND", "Estabelecimento não encontrado")
  }

  const monthlyLimit = establishment.organization.planLimitBookingsPerMonth
  if (monthlyLimit !== -1) {
    const monthStart = new Date()
    monthStart.setUTCDate(1)
    monthStart.setUTCHours(0, 0, 0, 0)
    const count = await db.booking.count({
      where: {
        establishmentId: establishment.id,
        createdAt: { gte: monthStart },
        status: { not: "CANCELLED" },
      },
    })
    if (count >= monthlyLimit) {
      throw new BookingError(
        "PLAN_LIMIT",
        "Limite de agendamentos do mês atingido. Entre em contato com o estabelecimento.",
      )
    }
  }

  const service = await db.service.findFirst({
    where: { id: input.serviceId, establishmentId: establishment.id, active: true },
  })
  if (!service) {
    throw new BookingError("SERVICE_NOT_FOUND", "Serviço não encontrado")
  }

  const link = await db.professionalService.findUnique({
    where: {
      professionalId_serviceId: {
        professionalId: input.professionalId,
        serviceId: input.serviceId,
      },
    },
  })
  if (!link) {
    throw new BookingError("PROFESSIONAL_NOT_FOUND", "Profissional não atende esse serviço")
  }

  const startsAt = new Date(input.startsAt)
  const endsAt = addMinutes(startsAt, service.durationMin)

  try {
    const booking = await db.booking.create({
      data: {
        publicToken: newPublicToken(),
        establishmentId: establishment.id,
        professionalId: input.professionalId,
        serviceId: input.serviceId,
        clientName: input.clientName,
        clientPhone: input.clientPhone,
        clientEmail: input.clientEmail,
        startsAt,
        endsAt,
        notes: input.notes,
      },
    })
    return booking
  } catch (err: unknown) {
    // Postgres exclusion_violation = 23P01 (a constraint EXCLUDE bate aqui)
    const code = (err as { code?: string }).code
    if (code === "23P01") {
      throw new BookingError("SLOT_TAKEN", "Horário já reservado, escolha outro")
    }
    throw err
  }
}
