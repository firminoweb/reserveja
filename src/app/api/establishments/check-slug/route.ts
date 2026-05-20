import { NextResponse, type NextRequest } from "next/server"

import { isSlugAvailable } from "@/server/onboarding/register"

/**
 * Check público de disponibilidade de slug. Usado no form de cadastro pra
 * feedback ao vivo. Não revela informações sensíveis — só boolean.
 */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")
  if (!slug) {
    return NextResponse.json({ available: false, reason: "empty" })
  }
  const available = await isSlugAvailable(slug)
  return NextResponse.json({ available })
}
