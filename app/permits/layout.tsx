/**
 * Permits Layout - Authentication Guard
 *
 * This layout wraps the permits page and enforces authentication.
 * If the user is not signed in, they are redirected to /sign-in.
 *
 * Route: /permits/*
 * Auth Required: Yes
 *
 * Authentication Flow:
 * 1. Check if Clerk auth is loaded
 * 2. If not loaded, show loading state
 * 3. If loaded but not signed in, redirect to /sign-in
 * 4. If signed in, render children (permits page)
 */

"use client"

import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function PermitsLayout({
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
