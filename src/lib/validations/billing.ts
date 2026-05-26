import { z } from "@/lib/zod"

export const subscribePlanSchema = z.object({
  plan: z.enum(["PRO", "PROFISSIONAL", "EMPRESARIAL"]),
})

export type SubscribePlanInput = z.infer<typeof subscribePlanSchema>
