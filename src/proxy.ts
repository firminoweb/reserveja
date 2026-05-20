import { NextResponse, type NextRequest } from "next/server"

// Next.js 16: middleware foi renomeado pra proxy (runtime nodejs only).
//
// Aqui fazemos uma checagem barata de presença do cookie de sessão NextAuth.
// Páginas/layouts em (panel) e (admin) também rodam guards próprios via
// requireSession()/requireRole() — esta é apenas a primeira camada.

const SESSION_COOKIES = [
  "authjs.session-token",        // dev (não-secure)
  "__Secure-authjs.session-token", // prod (secure)
]

export function proxy(request: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.get(name))

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("from", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/painel/:path*", "/admin/:path*"],
}
