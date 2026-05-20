import { z } from "@/lib/zod"

export const createTimeBlockSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:mm"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:mm"),
  professionalId: z.string().optional().nullable(),
  reason: z.string().max(200).optional(),
})

export type CreateTimeBlockInput = z.infer<typeof createTimeBlockSchema>
