import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Reserve Já — Agendamentos",
    short_name: "Reserve Já",
    description:
      "Agendamentos simples para salões, barbearias, mecânicas e mais. Sem app, sem cadastro pro cliente.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#4F46E5",
    lang: "pt-BR",
    dir: "ltr",
    categories: ["business", "productivity", "lifestyle"],
    icons: [
      // Vetorial — qualquer tamanho. iOS/Android modernos sabem usar.
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      // Vetorial maskable — Android aplica máscara/safe-zone.
      {
        src: "/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  }
}
