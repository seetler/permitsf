// User profile page - saves to Clerk user metadata
"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { User, Mail, Phone, MapPin, Building, Save, Loader2, Check, Crown, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  businessName: string
  businessType: string
  licenseNumber: string
  notes: string
}

const emptyProfile: ProfileData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  businessName: "",
  businessType: "",
  licenseNumber: "",
  notes: "",
}

export default function ProfilePage() {
  const { user } = useUser()
  const [formData, setFormData] = useState<ProfileData>(emptyProfile)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isLoadingPortal, setIsLoadingPortal] = useState(false)
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false)

  const isPaid = user?.publicMetadata?.subscriptionTier === "paid"

  const handleManageSubscription = async () => {
    setIsLoadingPortal(true)
    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error("Failed to open portal:", error)
    } finally {
      setIsLoadingPortal(false)
    }
  }

  const handleUpgrade = async () => {
    setIsLoadingCheckout(true)
    try {
      const response = await fetch("/api/stripe/checkout", { method: "POST" })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error("Failed to create checkout:", error)
    } finally {
      setIsLoadingCheckout(false)
    }
  }

  useEffect(() => {
    if (user?.unsafeMetadata?.profile) {
      setFormData(user.unsafeMetadata.profile as ProfileData)
    }
  }, [user])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      await user.update({
        unsafeMetadata: { ...user.unsafeMetadata, profile: formData },
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error("Failed to save profile:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-6 pt-16 md:pt-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-2">Manage your personal and business information</p>
      </div>

      <div className="max-w-4xl space-y-6">
        <Card className={isPaid ? "border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isPaid ? <Crown className="h-5 w-5 text-amber-500" /> : <Sparkles className="h-5 w-5 text-gray-400" />}
                <span>Subscription</span>
              </div>
              <Badge className={isPaid ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-600"}>
                {isPaid ? "Premium" : "Free"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isPaid ? (
              <div className="flex items-center justify-between">
                <p className="text-gray-600">You have full access to all features including permits management.</p>
                <Button variant="outline" onClick={handleManageSubscription} disabled={isLoadingPortal}>
                  {isLoadingPortal ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Manage Subscription
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-gray-600">Upgrade to Premium for full access to permits management.</p>
                <Button onClick={handleUpgrade} disabled={isLoadingCheckout}>
                  {isLoadingCheckout ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Crown className="h-4 w-4 mr-2" />}
                  Upgrade to Premium
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Personal Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={formData.firstName} onChange={(e) => handleInputChange("firstName", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={formData.lastName} onChange={(e) => handleInputChange("lastName", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="flex items-center space-x-1">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="phone" className="flex items-center space-x-1">
                  <Phone className="h-4 w-4" />
                  <span>Phone</span>
                </Label>
                <Input id="phone" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Address</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address">Street Address</Label>
              <Input id="address" value={formData.address} onChange={(e) => handleInputChange("address", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" value={formData.city} onChange={(e) => handleInputChange("city", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input id="state" value={formData.state} onChange={(e) => handleInputChange("state", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input id="zipCode" value={formData.zipCode} onChange={(e) => handleInputChange("zipCode", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Business Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input id="businessName" value={formData.businessName} onChange={(e) => handleInputChange("businessName", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="businessType">Business Type</Label>
                <Input id="businessType" value={formData.businessType} onChange={(e) => handleInputChange("businessType", e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input id="licenseNumber" value={formData.licenseNumber} onChange={(e) => handleInputChange("licenseNumber", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea id="notes" value={formData.notes} onChange={(e) => handleInputChange("notes", e.target.value)} rows={4} placeholder="Any additional information about your business or projects..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} className="flex items-center space-x-2">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{saved ? "Saved!" : "Save Profile"}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
