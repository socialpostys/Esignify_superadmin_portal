import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { InitClientStorage } from "./init-client-storage"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Email Signature Platform",
  description: "A platform for managing email signatures across organizations",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <InitClientStorage />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
