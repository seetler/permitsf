/**
 * Providers Component
 *
 * Wraps the application with necessary context providers.
 * Currently provides:
 * - ClerkProvider: Authentication context from Clerk
 *
 * This component is used in app/layout.tsx to wrap all pages,
 * making auth state available throughout the app via hooks like
 * useAuth(), useUser(), and useClerk().
 *
 * Usage:
 * <Providers>
 *   <YourApp />
 * </Providers>
 */

"use client"

import { ClerkProvider } from "@clerk/nextjs"
import { ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  return <ClerkProvider>{children}</ClerkProvider>
}
