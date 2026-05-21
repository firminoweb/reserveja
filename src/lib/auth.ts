import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

import { db } from "./db"
import { rateLimit } from "./rate-limit"
import { signInSchema } from "./validations/auth"

// Hash dummy pra evitar user enumeration via timing: quando o usuário não existe,
// rodamos bcrypt.compare contra esse hash pra igualar a latência. O conteúdo é
// irrelevante — nada deve dar match contra ele.
const DUMMY_HASH = "$2a$12$CwTycUXWue0Thq9StjUM0uJ8.Bx7Lq9C9oQrqL.A4lwPbhB7CfWG2"

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      },
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials)
        if (!parsed.success) return null

        // Rate limit por email: 5 tentativas / minuto. Best-effort por instância
        // (ver src/lib/rate-limit.ts). Aplica antes do bcrypt pra não desperdiçar CPU.
        const limited = rateLimit(`login:${parsed.data.email.toLowerCase()}`, {
          limit: 5,
          windowMs: 60_000,
        })
        if (!limited.success) return null

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        })

        if (!user) {
          // Roda bcrypt mesmo sem usuário pra evitar diferença de timing.
          await bcrypt.compare(parsed.data.password, DUMMY_HASH)
          return null
        }

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!ok) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id!
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId
        session.user.role = token.role
      }
      return session
    },
  },
})
