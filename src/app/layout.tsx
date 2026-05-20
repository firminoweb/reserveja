import type { Metadata } from "next"
import { Geist_Mono, Poppins } from "next/font/google"

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
    default: "Reserve Já — agendamentos sem complicação",
    template: "%s · Reserve Já",
  },
  description: "Agende horário no seu salão, barbearia ou prestador de serviço em segundos. Sem app, sem cadastro.",
  applicationName: "Reserve Já",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
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
      </body>
    </html>
  )
}
