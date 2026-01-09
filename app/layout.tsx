/**
 * Root Layout Component
 *
 * This is the top-level layout that wraps all pages in the application.
 * It provides:
 * - Global font (Inter from Google Fonts)
 * - Clerk authentication context via Providers
 * - Responsive sidebar navigation
 * - Main content area
 *
 * Layout hierarchy:
 * <html>
 *   <body>
 *     <Providers>           // Clerk auth context
 *       <div>               // Flex container for sidebar + main
 *         <Sidebar />       // Navigation (responsive)
 *         <main>{page}</main>
 *       </div>
 *     </Providers>
 *   </body>
 * </html>
 */

import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/sidebar"
import { Providers } from "@/components/providers"

// Load Inter font with Latin character subset
const inter = Inter({ subsets: ["latin"] })

// Page metadata for SEO and browser tab
export const metadata: Metadata = {
  title: "PermitSF",
  description: "Track and manage your San Francisco permits",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Providers wraps app with Clerk authentication context */}
        <Providers>
          {/* Main layout: sidebar + content area */}
          <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
