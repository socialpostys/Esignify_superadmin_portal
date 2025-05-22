"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle } from "lucide-react"
import { getOrganization, updateOrganization } from "@/lib/client-storage"

export default function AssignUserSignaturePage({ params }: { params: { id: string; userId: string } }) {
  const router = useRouter()
  const [organization, setOrganization] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = () => {
      setIsLoading(true)
      try {
        // Get organization from client storage
        const org = getOrganization(params.id)
        if (!org) {
          throw new Error("Organization not found")
        }

        // Find user
        const foundUser = (org.users || []).find((u: any) => u.id === params.userId)
        if (!foundUser) {
          throw new Error("User not found")
        }

        setOrganization(org)
        setUser(foundUser)
        setTemplates(org.signature_templates || [])

        // Set selected template if user already has one
        if (foundUser.has_signature && foundUser.signature_template_id) {
          setSelectedTemplate(foundUser.signature_template_id)
        } else if (org.signature_templates?.length > 0) {
          // Default to first template
          setSelectedTemplate(org.signature_templates[0].id)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        setError(`Failed to load data: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id, params.userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      // Validate inputs
      if (!selectedTemplate) {
        throw new Error("Please select a template")
      }

      // Update user with assigned signature
      updateOrganization(params.id, (org) => {
        const updatedUsers = (org.users || []).map((u: any) => {
          if (u.id === params.userId) {
            return {
              ...u,
              has_signature: true,
              signature_template_id: selectedTemplate,
              updated_at: new Date().toISOString(),
            }
          }
          return u
        })

        return {
          ...org,
          users: updatedUsers,
          updated_at: new Date().toISOString(),
        }
      })

      // Show success message
      setSuccess("Signature assigned successfully")

      // Update local state
      setUser({
        ...user,
        has_signature: true,
        signature_template_id: selectedTemplate,
      })
    } catch (err) {
      console.error("Error assigning signature:", err)
      setError(`Failed to assign signature: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout userRole="super-admin">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400 mr-2" />
          <p>Loading...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!organization || !user) {
    return (
      <DashboardLayout userRole="super-admin">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Organization or user not found</AlertDescription>
        </Alert>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="super-admin">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/super-admin/organizations/${params.id}/users`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Assign Signature</h1>
            <p className="text-muted-foreground">Assign a signature template to {user.name || user.email}</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Details of the user you're assigning a signature to</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Name</p>
                <p className="text-sm text-muted-foreground">{user.name || "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Department</p>
                <p className="text-sm text-muted-foreground">{user.department || "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Title</p>
                <p className="text-sm text-muted-foreground">{user.title || "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Current Signature</p>
                <p className="text-sm text-muted-foreground">{user.has_signature ? "Assigned" : "Not Assigned"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Select Signature Template</CardTitle>
              <CardDescription>Choose a signature template to assign to this user</CardDescription>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">No templates available</p>
                  <Button asChild>
                    <Link href={`/super-admin/organizations/${params.id}/signatures/new`}>Create Template</Link>
                  </Button>
                </div>
              ) : (
                <RadioGroup value={selectedTemplate} onValueChange={setSelectedTemplate} className="space-y-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`border rounded-md p-4 ${selectedTemplate === template.id ? "border-primary" : ""}`}
                    >
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value={template.id} id={template.id} />
                        <div className="grid gap-1.5">
                          <Label htmlFor={template.id} className="font-medium">
                            {template.name}
                          </Label>
                          {template.description && (
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                          )}
                          <div className="border rounded-md p-3 mt-2 bg-slate-50">
                            <div className="text-xs" dangerouslySetInnerHTML={{ __html: template.html_content }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/super-admin/organizations/${params.id}/users`)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || templates.length === 0}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Signature"
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
