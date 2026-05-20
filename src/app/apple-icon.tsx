import { ImageResponse } from "next/og"

import { LogoIconForImage } from "@/components/ui/logo-svg"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#4F46E5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LogoIconForImage size={180} />
      </div>
    ),
    { ...size },
  )
}
