import { db } from "@/lib/db"
import type {
  CreateProfessionalInput,
  UpdateProfessionalInput,
} from "@/lib/validations/professional"

export class ProfessionalError extends Error {
  constructor(public code: "NOT_FOUND" | "HAS_BOOKINGS", message: string) {
    super(message)
  }
}

async function assertServicesOwned(establishmentId: string, serviceIds: string[]) {
  if (serviceIds.length === 0) return
  const count = await db.service.count({
    where: { id: { in: serviceIds }, establishmentId },
  })
  if (count !== serviceIds.length) {
    throw new ProfessionalError("NOT_FOUND", "Serviço inválido")
  }
}

export async function createProfessional(
  establishmentId: string,
  input: CreateProfessionalInput,
) {
  const { serviceIds, schedules, ...rest } = input
  if (serviceIds?.length) await assertServicesOwned(establishmentId, serviceIds)

  return db.professional.create({
    data: {
      ...rest,
      establishmentId,
      services: serviceIds?.length
        ? { create: serviceIds.map((id) => ({ serviceId: id })) }
        : undefined,
      schedules: schedules?.length
        ? { create: schedules }
        : undefined,
    },
  })
}

export async function updateProfessional(
  establishmentId: string,
  professionalId: string,
  input: UpdateProfessionalInput,
) {
  const existing = await db.professional.findFirst({
    where: { id: professionalId, establishmentId },
    select: { id: true },
  })
  if (!existing) throw new ProfessionalError("NOT_FOUND", "Profissional não encontrado")

  const { serviceIds, schedules, ...rest } = input

  return db.$transaction(async (tx) => {
    if (serviceIds !== undefined) {
      await assertServicesOwned(establishmentId, serviceIds)
      await tx.professionalService.deleteMany({ where: { professionalId } })
      if (serviceIds.length > 0) {
        await tx.professionalService.createMany({
          data: serviceIds.map((id) => ({ professionalId, serviceId: id })),
        })
      }
    }

    if (schedules !== undefined) {
      await tx.professionalSchedule.deleteMany({ where: { professionalId } })
      if (schedules.length > 0) {
        await tx.professionalSchedule.createMany({
          data: schedules.map((s) => ({ professionalId, ...s })),
        })
      }
    }

    return tx.professional.update({ where: { id: professionalId }, data: rest })
  })
}

export async function deleteProfessional(establishmentId: string, professionalId: string) {
  const existing = await db.professional.findFirst({
    where: { id: professionalId, establishmentId },
    select: { id: true, _count: { select: { bookings: true } } },
  })
  if (!existing) throw new ProfessionalError("NOT_FOUND", "Profissional não encontrado")
  if (existing._count.bookings > 0) {
    throw new ProfessionalError(
      "HAS_BOOKINGS",
      "Profissional tem agendamentos — desative em vez de excluir",
    )
  }
  await db.professional.delete({ where: { id: professionalId } })
}
