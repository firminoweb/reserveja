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
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
          gap: 0,
        }}
      >
        {/* Logo: icon + text */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <LogoIconForImage size={88} />
          <div style={{ display: "flex", alignItems: "baseline", fontSize: 56, fontWeight: 700, letterSpacing: "-0.02em" }}>
            <span style={{ color: "#1a1a2e" }}>reserve</span>
            <span style={{ color: "#4F46E5" }}>já</span>
            <span style={{ color: "#9ca3af", fontWeight: 500, fontSize: 44 }}>.app</span>
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            marginTop: 28,
            fontSize: 28,
            color: "#6b7280",
            fontWeight: 400,
            textAlign: "center",
            maxWidth: 700,
            lineHeight: 1.5,
          }}
        >
          Agendamentos sem complicação pro seu negócio.
        </div>

        {/* Subtle bottom accent line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "#4F46E5",
          }}
        />
      </div>
    ),
    { ...size },
  )
}
