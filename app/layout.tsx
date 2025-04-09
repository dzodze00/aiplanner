import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./reset.css"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Detroit Cathode Manufacturing Dashboard",
  description: "S&OP Planning Dashboard for DCM",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
