import { db } from "@/lib/db"
import type { SaveWorkingHoursInput } from "@/lib/validations/working-hours"

/**
 * Substitui todos os WorkingHour do estabelecimento de uma vez.
 * Mais simples e correto que diff: a UI envia o estado final.
 */
export async function saveWorkingHours(
  establishmentId: string,
  input: SaveWorkingHoursInput,
) {
  return db.$transaction(async (tx) => {
    await tx.workingHour.deleteMany({ where: { establishmentId } })
    if (input.hours.length > 0) {
      await tx.workingHour.createMany({
        data: input.hours.map((h) => ({
          establishmentId,
          weekday: h.weekday,
          startMin: h.startMin,
          endMin: h.endMin,
        })),
      })
    }
    return tx.workingHour.findMany({
      where: { establishmentId },
      orderBy: [{ weekday: "asc" }, { startMin: "asc" }],
    })
  })
}
