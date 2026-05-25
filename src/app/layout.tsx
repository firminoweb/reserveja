import type { Metadata, Viewport } from "next"
import { Geist_Mono, Poppins } from "next/font/google"

import { GoogleAnalytics } from "@next/third-parties/google"

import { Toaster } from "@/components/ui/sonner"
import { Providers } from "@/app/providers"
import { cn } from "@/lib/utils"

import "./globals.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
})
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Reserve Já - agendamentos e reservas sem complicação",
    template: "%s · Reserve Já",
  },
  description:
    "Agende horário no seu salão, barbearia ou prestador de serviço em segundos. Sem app, sem cadastro.",
  applicationName: "Reserve Já",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Reserve Já",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Reserve Já",
  },
  twitter: {
    card: "summary_large_image",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4F46E5" },
    { media: "(prefers-color-scheme: dark)", color: "#1E1B4B" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={cn(
        "h-full antialiased",
        poppins.variable,
        geistMono.variable,
        "font-sans",
      )}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-background text-foreground text-base"
      >
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" />
        <GoogleAnalytics gaId="G-W14M6VS292" />
      </body>
    </html>
  )
}
