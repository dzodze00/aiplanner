import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
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
      <head>
        {/* Force CSS reload */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/globals.css" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
