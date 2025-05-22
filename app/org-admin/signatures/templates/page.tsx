"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PlusCircle, Loader2, AlertTriangle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { getOrganization } from "@/lib/client-storage"

export default function SignatureTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const fetchTemplates = () => {
      setIsLoading(true)
      try {
        // Get organization ID from localStorage
        const orgId = localStorage.getItem("currentOrganizationId")
        if (!orgId) {
          throw new Error("No organization selected")
        }

        // Get organization from client storage
        const organization = getOrganization(orgId)
        if (!organization) {
          throw new Error("Organization not found")
        }

        // Get templates from organization
        const orgTemplates = organization.signature_templates || []
        setTemplates(orgTemplates)
      } catch (error) {
        console.error("Error fetching templates:", error)
        setError(`Failed to load templates: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  if (isLoading) {
    return (
      <DashboardLayout userRole="org-admin">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400 mr-2" />
          <p>Loading signature templates...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="org-admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Signature Templates</h1>
            <p className="text-muted-foreground">Manage your organization's signature templates</p>
          </div>
          <Button asChild>
            <Link href="/org-admin/signatures/templates/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Template
            </Link>
          </Button>
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

        {templates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-3">
                <h3 className="text-lg font-medium">No signature templates yet</h3>
                <p className="text-muted-foreground">Create your first signature template to get started</p>
                <Button asChild className="mt-4">
                  <Link href="/org-admin/signatures/templates/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Template
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader className="pb-2">
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription>Created on {new Date(template.created_at).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md p-3 h-32 overflow-hidden">
                    <div dangerouslySetInnerHTML={{ __html: template.html_content }} />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/org-admin/signatures/templates/${template.id}`}>Preview</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href={`/org-admin/signatures/templates/${template.id}/edit`}>Edit</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
