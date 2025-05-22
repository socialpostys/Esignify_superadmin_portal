"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { Organization } from "@/lib/types"

export default function OrgLoginPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrganization = () => {
      setIsLoading(true)
      try {
        // Get all organizations from localStorage
        const storedOrgs = localStorage.getItem("newOrganizations")
        if (storedOrgs) {
          const orgs = JSON.parse(storedOrgs)
          // Find organization by domain (using as slug)
          const org = orgs.find((o: Organization) => o.domain === params.slug)
          if (org) {
            setOrganization(org)
          } else {
            setError("Organization not found")
          }
        } else {
          setError("No organizations available")
        }
      } catch (error) {
        console.error("Error fetching organization:", error)
        setError(`Failed to load organization: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrganization()
  }, [params.slug])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    // Simple validation
    if (!email || !password) {
      setError("Email and password are required")
      setIsSubmitting(false)
      return
    }

    // In a real implementation, this would call your API to authenticate the user
    // For now, we'll simulate a successful login for the admin
    if (organization?.adminEmail === email && password === "admin123") {
      // Set cookies for organization login
      document.cookie = `user_role=org_admin; path=/; max-age=${60 * 60 * 24}`
      document.cookie = `user_id=${organization.adminEmail}; path=/; max-age=${60 * 60 * 24}`
      document.cookie = `organization_id=${organization.id}; path=/; max-age=${60 * 60 * 24}`

      // Redirect to the organization admin dashboard
      setTimeout(() => {
        router.push("/org-admin/dashboard")
      }, 1000)
    } else {
      setError("Invalid email or password")
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  if (error && !organization) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
        <div className="w-full max-w-md space-y-4">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Organization Login</CardTitle>
              <CardDescription>Error</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button className="w-full mt-4" asChild>
                <a href="/">Return to Home</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Signify</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in to {organization?.name}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="text" placeholder="Email" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" placeholder="••••••••" required />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign In"}
              </Button>

              <div className="text-center mt-4">
                <p className="text-sm text-slate-500">Don't have an account? Contact your administrator.</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
