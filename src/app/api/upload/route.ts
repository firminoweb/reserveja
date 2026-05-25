import { NextResponse, type NextRequest } from "next/server"
import { v2 as cloudinary } from "cloudinary"

import { getApiOwnerContext } from "@/server/auth/guards"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const MAX_INPUT = 1 * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"]

export async function POST(req: NextRequest) {
  const ctx = await getApiOwnerContext()
  if (ctx instanceof NextResponse) return ctx

  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return NextResponse.json({ error: "upload_not_configured" }, { status: 503 })
  }

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
  const base64 = `data:${file.type};base64,${buffer.toString("base64")}`

  const result = await cloudinary.uploader.upload(base64, {
    folder: `reserveja/${ctx.establishmentId}`,
    transformation: [
      { width: 256, height: 256, crop: "fill", gravity: "auto" },
      { quality: "auto", fetch_format: "webp" },
    ],
    resource_type: "image",
  })

  return NextResponse.json({ url: result.secure_url })
}
