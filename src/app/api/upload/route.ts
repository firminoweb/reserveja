import { NextResponse, type NextRequest } from "next/server"
import { put } from "@vercel/blob"
import sharp from "sharp"

import { getApiOwnerContext } from "@/server/auth/guards"

const MAX_INPUT = 1 * 1024 * 1024 // 1 MB (raw upload)
const MAX_OUTPUT = 30 * 1024 // 30 KB (após conversão)
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"]

export async function POST(req: NextRequest) {
  const ctx = await getApiOwnerContext()
  if (ctx instanceof NextResponse) return ctx

  const formData = await req.formData()
  const file = formData.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "invalid_type" }, { status: 400 })
  }
  if (file.size > MAX_INPUT) {
    return NextResponse.json({ error: "too_large" }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  let webp = await sharp(buffer)
    .resize(256, 256, { fit: "cover", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer()

  if (webp.byteLength > MAX_OUTPUT) {
    webp = await sharp(buffer)
      .resize(256, 256, { fit: "cover", withoutEnlargement: true })
      .webp({ quality: 50 })
      .toBuffer()

    if (webp.byteLength > MAX_OUTPUT) {
      return NextResponse.json({ error: "still_too_large" }, { status: 400 })
    }
  }

  const pathname = `establishments/${ctx.establishmentId}/${Date.now()}.webp`
  const blob = await put(pathname, webp, { access: "public", addRandomSuffix: true })
  return NextResponse.json({ url: blob.url })
}
