import { ImageResponse } from "next/og"

import { LogoIconForImage } from "@/components/ui/logo-svg"

export const size = { width: 64, height: 64 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(<LogoIconForImage size={64} />, { ...size })
}
