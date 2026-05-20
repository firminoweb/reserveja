import { db } from "@/lib/db"
import { taxIdDigits } from "@/lib/tax"
import type { UpdateOrganizationInput } from "@/lib/validations/organization"

export async function updateOrganization(
  organizationId: string,
  input: UpdateOrganizationInput,
) {
  return db.organization.update({
    where: { id: organizationId },
    data: {
      name: input.name,
      category: input.category,
      taxId: input.taxId ? taxIdDigits(input.taxId) : null,
    },
  })
}
