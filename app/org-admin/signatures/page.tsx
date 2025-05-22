"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, AlertTriangle, Server, Download } from "lucide-react"

export default function SignaturesPage() {
  const [templates, setTemplates] = useState([])
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTemplates = () => {
      setIsLoading(true)
      try {
        // Get templates from localStorage
        const orgs = JSON.parse(localStorage.getItem("organizations") || "[]")
        if (orgs.length > 0) {
          const templates = orgs[0].signature_templates || []
          setTemplates(templates)
        }
      } catch (error) {
        console.error("Error fetching templates:", error)
        setError("Failed to load signature templates")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  return (
    <DashboardLayout userRole="org-admin">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Email Signatures</h1>
            <p className="text-muted-foreground">Create and manage email signature templates for your organization</p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/org-admin/signatures/templates/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Signature
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/org-admin/signatures/transport-rules">
                <Server className="mr-2 h-4 w-4" />
                Server Deployment
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="templates">
          <TabsList>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="deployment">Deployment</TabsTrigger>
          </TabsList>
          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Signature Templates</CardTitle>
                <CardDescription>Email signature templates for this organization</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Loading templates...</div>
                ) : templates.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template) => (
                      <Card key={template.id}>
                        <CardHeader className="p-4">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="flex justify-between">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/org-admin/signatures/templates/${template.id}/edit`}>Edit</Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/org-admin/signatures/templates/${template.id}/deploy`}>Deploy</Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-center">
                      <AlertTriangle className="h-8 w-8 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold">No Templates Found</h3>
                      <p className="text-muted-foreground">
                        This organization doesn't have any signature templates yet.
                      </p>
                      <Button className="mt-4" asChild>
                        <Link href="/org-admin/signatures/templates/new">Create Template</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="deployment">
            <Card>
              <CardHeader>
                <CardTitle>Signature Deployment</CardTitle>
                <CardDescription>Deploy signatures to users in your organization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Server-Side Deployment</CardTitle>
                      <CardDescription>Deploy signatures using Exchange transport rules</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Transport rules apply signatures on the server side, ensuring they appear on all emails
                        regardless of the device or email client used.
                      </p>
                      <Button asChild>
                        <Link href="/org-admin/signatures/transport-rules">
                          <Server className="mr-2 h-4 w-4" />
                          Configure Transport Rules
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Client-Side Deployment</CardTitle>
                      <CardDescription>Deploy signatures to Outlook clients</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Client-side deployment installs signatures directly in Outlook on user devices using PowerShell.
                      </p>
                      <Button variant="outline" asChild>
                        <Link href="/org-admin/users/assign">
                          <Download className="mr-2 h-4 w-4" />
                          Assign to Users
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
