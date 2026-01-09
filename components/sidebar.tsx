/**
 * Sidebar Navigation Component
 *
 * The main navigation sidebar for the application. Features:
 * - Responsive design: overlay on mobile, collapsible on desktop
 * - Navigation links to Hugo and Permits pages
 * - User profile section with sign in/out
 * - Active state highlighting for current route
 *
 * Mobile Behavior:
 * - Hidden by default
 * - Opens as overlay when hamburger button (top-left) is clicked
 * - Closes when backdrop is clicked or X button is pressed
 * - Closes when a navigation link is clicked
 *
 * Desktop Behavior:
 * - Always visible
 * - Can be collapsed to icon-only mode
 * - Menu button toggles between expanded/collapsed
 */

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Bot, FileText, User, Menu, LogOut, X } from "lucide-react"
import Image from "next/image"
import { useUser, useClerk } from "@clerk/nextjs"

/**
 * Navigation items configuration
 * Each item has a name, route path, and icon component
 */
const navigation = [
  { name: "Hugo", href: "/hugo", icon: Bot },
  { name: "My Permits", href: "/permits", icon: FileText },
]

export function Sidebar() {
  // Current route for active state highlighting
  const pathname = usePathname()

  // Desktop: collapsed state (icon-only mode)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Mobile: open/closed state for overlay
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Clerk user data and sign out function
  const { user, isSignedIn } = useUser()
  const { signOut } = useClerk()

  /**
   * Gets the user's initial for the avatar
   * Tries firstName, then username, then email
   */
  const getInitial = () => {
    if (user?.firstName) return user.firstName[0].toUpperCase()
    if (user?.username) return user.username[0].toUpperCase()
    if (user?.emailAddresses?.[0]?.emailAddress) return user.emailAddresses[0].emailAddress[0].toUpperCase()
    return "?"
  }

  return (
    <>
      {/* Mobile hamburger button - fixed position, only visible on small screens */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-md shadow-md border border-gray-200"
      >
        <Menu className="h-5 w-5 text-gray-600" />
      </button>

      {/* Mobile backdrop - darkens the screen when sidebar is open */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main sidebar container */}
      <div
        className={cn(
          "bg-white shadow-sm border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col",
          // Mobile: fixed overlay positioning
          "fixed md:relative inset-y-0 left-0 z-50",
          // Mobile: slide in/out animation
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          // Desktop: width based on collapsed state
          isCollapsed ? "md:w-12" : "w-64"
        )}
      >
        {/* Header section with logo and collapse button */}
        <div className={`p-6 ${isCollapsed ? "px-2 py-3" : ""}`}>
          <div className="flex items-center justify-between">
            {/* Logo and title - hidden when collapsed */}
            {!isCollapsed && (
              <div className="flex items-center space-x-2">
                <Image src="/images/hugo.jpg" alt="SF Logo" width={32} height={32} className="rounded-full" />
                <h1 className="text-xl font-bold text-gray-900">Permit Tracker</h1>
              </div>
            )}
            {/* Toggle button: X on mobile (to close), Menu on desktop (to collapse) */}
            <button
              onClick={() => {
                if (isMobileOpen) {
                  setIsMobileOpen(false)
                } else {
                  setIsCollapsed(!isCollapsed)
                }
              }}
              className={`p-1 rounded-md hover:bg-gray-100 transition-colors ${isCollapsed ? "mx-auto" : ""}`}
            >
              {isMobileOpen ? (
                <X className="h-5 w-5 text-gray-600" />
              ) : (
                <Menu className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation links - visible when expanded or mobile open */}
        {(!isCollapsed || isMobileOpen) && (
          <nav className="mt-8 px-4 flex-1">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={cn(
                        "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                        isActive
                          ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                      )}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        )}

        {/* User profile section - visible when expanded or mobile open */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="p-4 border-t border-gray-200">
            {isSignedIn ? (
              // Signed in: show profile link and sign out button
              <div className="space-y-2">
                <Link
                  href="/profile"
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                    pathname === "/profile"
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                  )}
                >
                  {/* User avatar with initial */}
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mr-3 text-sm font-semibold">
                    {getInitial()}
                  </div>
                  <span>{user?.firstName || user?.username || "My Profile"}</span>
                </Link>
                <button
                  onClick={() => {
                    signOut()
                    setIsMobileOpen(false)
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </div>
            ) : (
              // Not signed in: show sign in link
              <Link
                href="/sign-in"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
              >
                <User className="mr-3 h-5 w-5" />
                <span>Sign in</span>
              </Link>
            )}
          </div>
        )}

        {/* Collapsed state: icon-only user section (desktop only) */}
        {isCollapsed && !isMobileOpen && (
          <div className="hidden md:block p-2 border-t border-gray-200">
            {isSignedIn ? (
              <Link href="/profile" className="block mx-auto">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold hover:bg-blue-700 transition-colors">
                  {getInitial()}
                </div>
              </Link>
            ) : (
              <Link href="/sign-in" className="block mx-auto p-1 hover:bg-gray-100 rounded-full">
                <User className="h-5 w-5 text-gray-600" />
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  )
}
