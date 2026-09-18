// Shared auth guard layout - redirects to /sign-in if not authenticated
"use client"

import { useAuth } from "@clerk/nextjs"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push(`/sign-in?redirect_url=${encodeURIComponent(pathname + window.location.search)}`)
    }
  }, [isLoaded, isSignedIn, router, pathname])

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-full">Loading...</div>
  }

  if (!isSignedIn) {
    return null
  }

  return <>{children}</>
}
