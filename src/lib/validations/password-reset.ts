import { z } from "@/lib/zod"

export const requestResetSchema = z.object({
  email: z.string().email("E-mail inválido"),
})

export const confirmResetSchema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(8, "Senha precisa de pelo menos 8 caracteres"),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Informe a senha atual"),
  newPassword: z.string().min(8, "Senha precisa de pelo menos 8 caracteres"),
})

export type RequestResetInput = z.infer<typeof requestResetSchema>
export type ConfirmResetInput = z.infer<typeof confirmResetSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
