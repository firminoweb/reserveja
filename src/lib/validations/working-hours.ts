import { z } from "@/lib/zod"

const intervalSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    startMin: z.number().int().min(0).max(24 * 60),
    endMin: z.number().int().min(0).max(24 * 60),
  })
  .refine((v) => v.endMin > v.startMin, { message: "Fim deve ser depois do início" })

export const saveWorkingHoursSchema = z.object({
  hours: z.array(intervalSchema).max(7 * 4),
})

export type SaveWorkingHoursInput = z.infer<typeof saveWorkingHoursSchema>
