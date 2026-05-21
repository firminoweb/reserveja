"use server"

import { AuthError } from "next-auth"

import { signIn } from "@/lib/auth"
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth"
import { RegisterError, registerOwner } from "@/server/onboarding/register"

type ActionResult =
  | { ok: true }
  | { ok: false; field?: keyof SignUpInput; message: string }

export async function registerAction(input: SignUpInput): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      ok: false,
      field: first?.path[0] as keyof SignUpInput | undefined,
      message: first?.message ?? "Dados inválidos",
    }
  }

  try {
    await registerOwner(parsed.data)
  } catch (err) {
    if (err instanceof RegisterError) {
      // EMAIL_TAKEN intencionalmente NÃO destaca o campo email (anti-enumeration):
      // o usuário legítimo recebe email separado com instruções de login/reset;
      // o atacante recebe a mesma mensagem genérica que poderia vir de qualquer
      // outra falha de cadastro.
      if (err.code === "EMAIL_TAKEN") {
        return {
          ok: false,
          message: "Não foi possível concluir o cadastro. Se você já tem conta, verifique seu e-mail.",
        }
      }
      const fieldMap = {
        SLUG_TAKEN: "slug",
        PASSWORD_LEAKED: "password",
      } as const
      return {
        ok: false,
        field: fieldMap[err.code as "SLUG_TAKEN" | "PASSWORD_LEAKED"],
        message: err.message,
      }
    }
    console.error("[cadastro] registerOwner falhou", err)
    return { ok: false, message: "Não foi possível concluir o cadastro" }
  }

  // signIn com redirectTo joga um NEXT_REDIRECT — deixar propagar.
  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo: "/painel",
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, message: "Cadastro criado, mas falhou ao entrar. Faça login." }
    }
    throw err
  }

  return { ok: true }
}
