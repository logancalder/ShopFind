import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"

// inter is the font we're using
const inter = Inter({ subsets: ["latin"] })

// metadata for the site
export const metadata: Metadata = {
  title: "ShopFind - Find Products in Stores Near You",
  description: "Locate exactly where to buy the products you need at the best prices in your area!"
}

// handles routing and applies the font to all components
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}