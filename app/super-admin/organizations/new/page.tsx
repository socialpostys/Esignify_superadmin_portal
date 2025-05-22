"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Upload, Loader2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import Image from "next/image"
import { nanoid } from "nanoid"
import { saveOrganization } from "@/lib/client-storage"

export default function NewOrganizationPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [blobWarning, setBlobWarning] = useState(false)
  const [dbWarning, setDbWarning] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form data state
  const [formData, setFormData] = useState({
    name: "",
    domain: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    tenantId: "",
    clientId: "",
    clientSecret: "",
  })

  // Check if we're in development mode to show appropriate warnings
  useEffect(() => {
    // In a real app, we would check if the Blob integration is available
    if (process.env.NODE_ENV === "development") {
      setBlobWarning(true)
      setDbWarning(true)
    }
  }, [])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "logos")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload logo")
      }

      const data = await response.json()
      setLogoUrl(data.url)
    } catch (err) {
      console.error("Logo upload error:", err)
      setError(`Logo upload failed: ${err instanceof Error ? err.message : String(err)}`)

      // If we get a Blob token error, show the warning
      if (err instanceof Error && err.message.includes("BLOB_READ_WRITE_TOKEN")) {
        setBlobWarning(true)
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validateCurrentTab = () => {
    setError("")

    if (activeTab === "details") {
      if (!formData.name) {
        setError("Organization name is required")
        return false
      }
      if (!formData.domain) {
        setError("Domain is required")
        return false
      }
    } else if (activeTab === "admin") {
      if (!formData.adminName) {
        setError("Admin name is required")
        return false
      }
      if (!formData.adminEmail) {
        setError("Admin email is required")
        return false
      }
      if (!formData.adminPassword) {
        setError("Admin password is required")
        return false
      }
    }

    return true
  }

  const handleNext = () => {
    if (!validateCurrentTab()) return

    if (activeTab === "details") {
      setActiveTab("admin")
    } else if (activeTab === "admin") {
      setActiveTab("azure")
    }
  }

  const handleBack = () => {
    if (activeTab === "admin") {
      setActiveTab("details")
    } else if (activeTab === "azure") {
      setActiveTab("admin")
    }
  }

  // Direct submit function that uses client-storage
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSubmitting(true)
      setError("")

      // Validate required fields
      if (!formData.name || !formData.domain) {
        setError("Organization name and domain are required")
        setIsSubmitting(false)
        return
      }

      // Create organization object
      const newOrg = {
        id: nanoid(),
        name: formData.name,
        domain: formData.domain,
        logo_url: logoUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        users_count: 0,
        templates_count: 0,
        azure_status: "Pending",
        adminName: formData.adminName,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword,
        azure: {
          tenantId: formData.tenantId,
          clientId: formData.clientId,
          clientSecret: formData.clientSecret,
          isConnected: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }

      // Store in client-storage
      saveOrganization(newOrg)
      console.log("Organization created and stored:", newOrg)

      // Add a small timeout to give the user feedback that something happened
      setTimeout(() => {
        router.push("/super-admin/organizations")
      }, 500)
    } catch (err) {
      console.error("Submission error:", err)
      setError(`An unexpected error occurred: ${err instanceof Error ? err.message : String(err)}`)
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout userRole="super-admin">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/super-admin/organizations">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add Organization</h1>
            <p className="text-muted-foreground">Create a new organization in the system</p>
          </div>
        </div>

        {blobWarning && (
          <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Vercel Blob Integration Required</AlertTitle>
            <AlertDescription className="text-yellow-700">
              The Blob integration is not configured. Logo uploads will use a temporary fallback method.
              <Button
                variant="link"
                className="h-auto p-0 text-yellow-800 underline"
                onClick={() => window.open("https://vercel.com/docs/storage/vercel-blob/quickstart", "_blank")}
              >
                Learn how to add the Blob integration
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {dbWarning && (
          <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Supabase Integration Required</AlertTitle>
            <AlertDescription className="text-yellow-700">
              The Supabase integration is not configured. Data will be stored temporarily in your browser.
              <Button
                variant="link"
                className="h-auto p-0 text-yellow-800 underline"
                onClick={() => window.open("https://vercel.com/integrations/supabase", "_blank")}
              >
                Learn how to add the Supabase integration
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Organization Details</TabsTrigger>
            <TabsTrigger value="admin">Admin Account</TabsTrigger>
            <TabsTrigger value="azure">Azure Settings</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Organization Details</CardTitle>
                  <CardDescription>Enter the basic information about the organization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Organization Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Acme Inc"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="domain">Domain</Label>
                    <Input
                      id="domain"
                      name="domain"
                      placeholder="acme.com"
                      value={formData.domain}
                      onChange={handleInputChange}
                      required
                    />
                    <p className="text-xs text-slate-500">The primary domain for this organization</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logo">Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-md border border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                        {logoUrl ? (
                          <Image
                            src={logoUrl || "/placeholder.svg"}
                            alt="Organization logo"
                            width={64}
                            height={64}
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <Upload className="h-6 w-6 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          id="logo"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                          disabled={isUploading}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            "Upload Logo"
                          )}
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">Recommended size: 256x256px. Max file size: 2MB.</p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="button" onClick={handleNext}>
                    Next
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="admin" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Admin Account</CardTitle>
                  <CardDescription>Create an admin account for this organization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminName">Admin Name</Label>
                    <Input
                      id="adminName"
                      name="adminName"
                      placeholder="John Doe"
                      value={formData.adminName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Admin Email</Label>
                    <Input
                      id="adminEmail"
                      name="adminEmail"
                      type="email"
                      placeholder="admin@acme.com"
                      value={formData.adminEmail}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="adminPassword">Temporary Password</Label>
                    <Input
                      id="adminPassword"
                      name="adminPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.adminPassword}
                      onChange={handleInputChange}
                      required
                    />
                    <p className="text-xs text-slate-500">
                      The admin will be prompted to change this password on first login
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                  <Button type="button" onClick={handleNext}>
                    Next
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="azure" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Azure AD Settings</CardTitle>
                  <CardDescription>Configure Azure Active Directory integration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tenantId">Tenant ID</Label>
                    <Input
                      id="tenantId"
                      name="tenantId"
                      placeholder="00000000-0000-0000-0000-000000000000"
                      value={formData.tenantId}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client ID</Label>
                    <Input
                      id="clientId"
                      name="clientId"
                      placeholder="00000000-0000-0000-0000-000000000000"
                      value={formData.clientId}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientSecret">Client Secret</Label>
                    <Input
                      id="clientSecret"
                      name="clientSecret"
                      type="password"
                      placeholder="••••••••"
                      value={formData.clientSecret}
                      onChange={handleInputChange}
                    />
                  </div>

                  <p className="text-sm text-slate-500">
                    Azure AD settings can be configured later by the organization admin
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Organization"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </form>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
