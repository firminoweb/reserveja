import { NextResponse, type NextRequest } from "next/server"

import { clientIp, rateLimit } from "@/lib/rate-limit"
import { isSlugAvailable } from "@/server/onboarding/register"

/**
 * Check público de disponibilidade de slug. Usado no form de cadastro pra
 * feedback ao vivo. Não revela informações sensíveis — só boolean.
 *
 * Tem rate limit pra evitar enumeração de slugs cadastrados via brute-force.
 */
export async function GET(req: NextRequest) {
  const limited = rateLimit(`checkslug:${clientIp(req)}`, {
    limit: 60,
    windowMs: 60_000,
  })
  if (!limited.success) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 })
  }

  const slug = req.nextUrl.searchParams.get("slug")
  if (!slug) {
    return NextResponse.json({ available: false, reason: "empty" })
  }
  const available = await isSlugAvailable(slug)
  return NextResponse.json({ available })
}
