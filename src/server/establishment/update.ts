import { db } from "@/lib/db"
import { toE164BR } from "@/lib/phone"
import type { UpdateEstablishmentInput } from "@/lib/validations/establishment"

export async function updateEstablishment(
  establishmentId: string,
  input: UpdateEstablishmentInput,
) {
  // schema já validou via isValidBR — non-null assertion segura
  const whatsappE164 = toE164BR(input.whatsapp)!

  return db.establishment.update({
    where: { id: establishmentId },
    data: {
      name: input.name,
      description: input.description?.trim() || null,
      whatsapp: whatsappE164,
      timezone: input.timezone,
      logoUrl: input.logoUrl?.trim() || null,
      coverUrl: input.coverUrl?.trim() || null,
    },
  })
}
