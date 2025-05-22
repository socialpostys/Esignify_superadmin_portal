"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, AlertTriangle, Loader2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { getOrganization, updateOrganization } from "@/lib/client-storage"
import type { Organization } from "@/lib/types"

export default function EditOrganizationPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Form fields
  const [name, setName] = useState("")
  const [domain, setDomain] = useState("")
  const [logo, setLogo] = useState<string | null>(null)
  const [adminName, setAdminName] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")

  useEffect(() => {
    const fetchOrganization = () => {
      setIsLoading(true)
      try {
        const org = getOrganization(params.id)
        if (org) {
          setOrganization(org)
          setName(org.name || "")
          setDomain(org.domain || "")
          setLogo(org.logo || null)
          setAdminName(org.admin_name || "")
          setAdminEmail(org.admin_email || "")
          // Don't set the password - it will be updated only if provided
        } else {
          setError("Organization not found")
        }
      } catch (error) {
        console.error("Error fetching organization:", error)
        setError(`Failed to load organization: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrganization()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (!organization) {
        throw new Error("Organization not found")
      }

      // Update the organization
      updateOrganization(params.id, (org) => {
        return {
          ...org,
          name,
          domain,
          logo,
          admin_name: adminName,
          admin_email: adminEmail,
          // Only update password if provided
          ...(adminPassword ? { admin_password: adminPassword } : {}),
          updated_at: new Date().toISOString(),
        }
      })

      // Redirect back to the organization page
      router.push(`/super-admin/organizations/${params.id}`)
    } catch (err) {
      console.error("Error updating organization:", err)
      setError(`Failed to update organization: ${err instanceof Error ? err.message : String(err)}`)
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout userRole="super-admin">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400 mr-2" />
          <p>Loading organization...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (error && !organization) {
    return (
      <DashboardLayout userRole="super-admin">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/super-admin/organizations">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Edit Organization</h1>
          </div>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button asChild>
            <Link href="/super-admin/organizations">Go Back</Link>
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="super-admin">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/super-admin/organizations/${params.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Organization</h1>
            <p className="text-muted-foreground">Update organization details</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
                <CardDescription>Update the basic information about this organization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Input id="domain" value={domain} onChange={(e) => setDomain(e.target.value)} />
                  <p className="text-sm text-muted-foreground">The primary domain for this organization</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo">Logo</Label>
                  <div className="flex items-center gap-4">
                    {logo && (
                      <div className="w-16 h-16 border rounded-md flex items-center justify-center overflow-hidden">
                        <img
                          src={logo || "/placeholder.svg"}
                          alt="Organization logo"
                          className="max-w-full max-h-full"
                        />
                      </div>
                    )}
                    <Button type="button" variant="outline" size="sm">
                      Upload Logo
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Recommended size: 256x256px. Max file size: 2MB.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Admin Account</CardTitle>
                <CardDescription>Update the admin account for this organization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminName">Admin Name</Label>
                  <Input id="adminName" value={adminName} onChange={(e) => setAdminName(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Password</Label>
                  <div className="relative">
                    <Input
                      id="adminPassword"
                      type={showPassword ? "text" : "password"}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Leave blank to keep current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Leave blank to keep the current password</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/super-admin/organizations/${params.id}`)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
