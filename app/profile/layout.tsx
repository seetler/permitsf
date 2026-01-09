/**
 * Profile Layout - Authentication Guard
 *
 * This layout wraps the profile page and enforces authentication.
 * If the user is not signed in, they are redirected to /sign-in.
 *
 * Route: /profile/*
 * Auth Required: Yes
 *
 * Note: This is identical to permits/layout.tsx. Both use the same
 * authentication pattern for protected routes.
 */

"use client"

import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get auth state from Clerk
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in")
    }
  }, [isLoaded, isSignedIn, router])

  // Show loading while Clerk initializes
  if (!isLoaded) {
    return <div className="flex items-center justify-center h-full">Loading...</div>
  }

  // Don't render anything while redirecting
  if (!isSignedIn) {
    return null
  }

  // User is authenticated, render the page
  return <>{children}</>
}
