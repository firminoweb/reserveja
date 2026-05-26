import { db } from "@/lib/db"
import { toE164BR } from "@/lib/phone"
import { cepDigits } from "@/lib/viacep"
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
      instagram: input.instagram?.trim() || null,
      facebook: input.facebook?.trim() || null,
      tiktok: input.tiktok?.trim() || null,
      youtube: input.youtube?.trim() || null,
      cep: input.cep ? cepDigits(input.cep) : null,
      street: input.street?.trim() || null,
      streetNumber: input.streetNumber?.trim() || null,
      complement: input.complement?.trim() || null,
      neighborhood: input.neighborhood?.trim() || null,
      city: input.city?.trim() || null,
      state: input.state?.trim().toUpperCase() || null,
    },
  })
}
