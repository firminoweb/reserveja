import type { NextConfig } from "next"

// Content Security Policy básico. Permite assets do próprio app, inline styles
// (necessário pro Tailwind/shadcn no Next App Router) e imagens via HTTPS de
// qualquer origem (logos/covers de estabelecimentos que vêm de CDNs externas).
//
// Se precisar embutir scripts inline, considerar nonce-based CSP via middleware
// — mas isso adiciona complexidade. Pra hoje, 'unsafe-inline' em script-src é
// o que o Next App Router exige sem nonce setup.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https: data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ")

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // HSTS só faz sentido em produção (HTTPS). 2 anos + includeSubDomains é o padrão recomendado.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
