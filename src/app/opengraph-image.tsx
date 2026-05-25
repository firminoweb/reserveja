import { ImageResponse } from "next/og"

import { LogoIconForImage } from "@/components/ui/logo-svg"

export const alt = "Reserve Já — agendamentos sem complicação"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#4F46E5",
          gap: 48,
          padding: "0 80px",
        }}
      >
        <LogoIconForImage size={160} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.1,
            }}
          >
            Reserve Já
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 400,
              color: "rgba(255,255,255,0.8)",
              lineHeight: 1.4,
              maxWidth: 600,
            }}
          >
            Agendamentos sem complicação pro seu negócio.
            Sem app, sem cadastro pro cliente.
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
