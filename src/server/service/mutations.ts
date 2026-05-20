import { db } from "@/lib/db"
import type { CreateServiceInput, UpdateServiceInput } from "@/lib/validations/service"

export class ServiceError extends Error {
  constructor(public code: "NOT_FOUND" | "HAS_BOOKINGS", message: string) {
    super(message)
  }
}

export async function createService(establishmentId: string, input: CreateServiceInput) {
  const { professionalIds, ...rest } = input
  return db.service.create({
    data: {
      ...rest,
      establishmentId,
      professionals: professionalIds?.length
        ? { create: professionalIds.map((id) => ({ professionalId: id })) }
        : undefined,
    },
  })
}

export async function updateService(
  establishmentId: string,
  serviceId: string,
  input: UpdateServiceInput,
) {
  const existing = await db.service.findFirst({
    where: { id: serviceId, establishmentId },
    select: { id: true },
  })
  if (!existing) throw new ServiceError("NOT_FOUND", "Serviço não encontrado")

  const { professionalIds, ...rest } = input

  if (professionalIds !== undefined) {
    return db.$transaction(async (tx) => {
      await tx.professionalService.deleteMany({ where: { serviceId } })
      if (professionalIds.length > 0) {
        await tx.professionalService.createMany({
          data: professionalIds.map((id) => ({ professionalId: id, serviceId })),
        })
      }
      return tx.service.update({ where: { id: serviceId }, data: rest })
    })
  }

  return db.service.update({ where: { id: serviceId }, data: rest })
}

export async function deleteService(establishmentId: string, serviceId: string) {
  const existing = await db.service.findFirst({
    where: { id: serviceId, establishmentId },
    select: { id: true, _count: { select: { bookings: true } } },
  })
  if (!existing) throw new ServiceError("NOT_FOUND", "Serviço não encontrado")
  if (existing._count.bookings > 0) {
    throw new ServiceError(
      "HAS_BOOKINGS",
      "Serviço tem agendamentos — desative em vez de excluir",
    )
  }
  await db.service.delete({ where: { id: serviceId } })
}
