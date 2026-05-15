// Responsive sidebar: overlay on mobile, collapsible on desktop
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Bot, FileText, User, Menu, LogOut, X, AlertCircle } from "lucide-react"
import Image from "next/image"
import { useUser, useClerk } from "@clerk/nextjs"

const navigation = [
  { name: "Hugo", href: "/hugo", icon: Bot },
  { name: "My Permits", href: "/permits", icon: FileText },
  { name: "My Profile", href: "/profile", icon: User },
  //{ name: "Disclaimer", href: "/disclaimer", icon: AlertCircle },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { user, isSignedIn } = useUser()
  const { signOut } = useClerk()

  const getInitial = () => {
    if (user?.firstName) return user.firstName[0].toUpperCase()
    if (user?.username) return user.username[0].toUpperCase()
    if (user?.emailAddresses?.[0]?.emailAddress) return user.emailAddresses[0].emailAddress[0].toUpperCase()
    return "?"
  }

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-md shadow-md border border-gray-200"
      >
        <Menu className="h-5 w-5 text-gray-600" />
      </button>

      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsMobileOpen(false)} />
      )}

      <div
        className={cn(
          "bg-white shadow-sm border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col",
          "fixed md:relative inset-y-0 left-0 z-50",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          isCollapsed ? "md:w-12" : "w-64"
        )}
      >
        <div className={`p-6 ${isCollapsed ? "px-2 py-3" : ""}`}>
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center space-x-2">
                <Image src="/images/hugo.jpg" alt="SF Logo" width={32} height={32} className="rounded-full" />
                <h1 className="text-xl font-bold text-gray-900">Permit Tracker</h1>
              </div>
            )}
            <button
              onClick={() => (isMobileOpen ? setIsMobileOpen(false) : setIsCollapsed(!isCollapsed))}
              className={`p-1 rounded-md hover:bg-gray-100 transition-colors ${isCollapsed ? "mx-auto" : ""}`}
            >
              {isMobileOpen ? <X className="h-5 w-5 text-gray-600" /> : <Menu className="h-5 w-5 text-gray-600" />}
            </button>
          </div>
        </div>

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
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
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

        {(!isCollapsed || isMobileOpen) && (
          <div className="p-4 border-t border-gray-200">
            {isSignedIn ? (
              <div className="space-y-2">
                <Link
                  href="/profile"
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                    pathname === "/profile"
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
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
