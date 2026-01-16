"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Loader2, Lock, X } from "lucide-react"

interface PaywallModalProps {
  onClose?: () => void
}

export function PaywallModal({ onClose }: PaywallModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubscribe = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error("Failed to create checkout session:", error)
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-md mx-4 shadow-2xl">
        <CardHeader className="text-center pb-2">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
            <Lock className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Upgrade to Premium</CardTitle>
          <p className="text-gray-600 mt-2">
            Get full access to manage your permits
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span className="text-gray-700">View and track all your permits</span>
            </div>
            <div className="flex items-center space-x-3">
              <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span className="text-gray-700">Submit new permit applications</span>
            </div>
            <div className="flex items-center space-x-3">
              <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span className="text-gray-700">Download permit documents</span>
            </div>
            <div className="flex items-center space-x-3">
              <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span className="text-gray-700">Priority support</span>
            </div>
          </div>

          <div className="text-center py-4 border-t border-b">
            <div className="text-3xl font-bold text-gray-900">
              $9.99<span className="text-lg font-normal text-gray-500">/month</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Cancel anytime</p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full h-12 text-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                "Subscribe Now"
              )}
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                onClick={onClose}
                className="w-full text-gray-500"
              >
                Maybe later
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
