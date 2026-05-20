import { z } from "@/lib/zod"

import { isValidBR } from "@/lib/phone"

export const createBookingSchema = z.object({
  establishmentSlug: z.string().min(1),
  serviceId: z.string().min(1),
  professionalId: z.string().min(1),
  startsAt: z.string().datetime({ message: "Horário inválido" }),
  clientName: z.string().trim().min(2, "Nome muito curto").max(120, "Nome muito longo"),
  clientPhone: z
    .string()
    .refine((v) => isValidBR(v), "WhatsApp inválido"),
  notes: z.string().trim().max(500).optional(),
})

export const availabilityQuerySchema = z.object({
  establishmentSlug: z.string().min(1),
  serviceId: z.string().min(1),
  professionalId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use formato YYYY-MM-DD"),
})

export type CreateBookingInput = z.infer<typeof createBookingSchema>
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>
