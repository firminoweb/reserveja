import { NextResponse } from "next/server"

// Cadastro de estabelecimento via API. Esqueleto — implementação completa virá
// com o fluxo de onboarding (provavelmente Server Action em (auth)/cadastro).
export async function POST() {
  return NextResponse.json(
    { error: "not_implemented", message: "Use o fluxo /cadastro" },
    { status: 501 },
  )
}
