"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  PlusCircle,
  Loader2,
  AlertTriangle,
  FileSignature,
  Edit,
  Trash,
  MoreVertical,
  Send,
  Download,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getOrganization, updateOrganization } from "@/lib/client-storage"

export default function OrganizationSignaturesPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [organization, setOrganization] = useState<any>(null)
  const [templates, setTemplates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = () => {
      setIsLoading(true)
      try {
        // Get organization from client storage
        const org = getOrganization(params.id)
        if (!org) {
          throw new Error("Organization not found")
        }

        setOrganization(org)
        setTemplates(org.signature_templates || [])
      } catch (error) {
        console.error("Error fetching data:", error)
        setError(`Failed to load data: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  const handleDeleteTemplate = (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return
    }

    try {
      // Update organization by removing the template
      updateOrganization(params.id, (org) => {
        const updatedTemplates = (org.signature_templates || []).filter((template: any) => template.id !== templateId)

        return {
          ...org,
          signature_templates: updatedTemplates,
          templates_count: updatedTemplates.length,
          updated_at: new Date().toISOString(),
        }
      })

      // Update local state
      setTemplates(templates.filter((template) => template.id !== templateId))
    } catch (error) {
      console.error("Error deleting template:", error)
      setError(`Failed to delete template: ${error instanceof Error ? error.message : String(error)}`)
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

  if (!organization) {
    return (
      <DashboardLayout userRole="super-admin">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Organization not found</AlertDescription>
        </Alert>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="super-admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
            <p className="text-muted-foreground">{organization.domain}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/super-admin/organizations/${params.id}/export`}>
                <Download className="mr-2 h-4 w-4" />
                Export & Deploy
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/super-admin/organizations/${params.id}/signatures/new`}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Signature
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/super-admin/organizations/${params.id}`}>Overview</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/super-admin/organizations/${params.id}/users`}>Users</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/super-admin/organizations/${params.id}/azure-settings`}>Azure Integration</Link>
          </Button>
          <Button variant="default" size="sm">
            Signatures
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Signature Templates</CardTitle>
            <CardDescription>Email signature templates for this organization</CardDescription>
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileSignature className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Templates Found</h3>
                <p className="text-muted-foreground mb-4">
                  This organization doesn't have any signature templates yet.
                </p>
                <Button asChild>
                  <Link href={`/super-admin/organizations/${params.id}/signatures/new`}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Template
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center">
                            {template.name}
                            {template.is_default && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                Default
                              </span>
                            )}
                          </CardTitle>
                          <CardDescription className="line-clamp-2">
                            {template.description || "No description provided"}
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/super-admin/organizations/${params.id}/signatures/${template.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/super-admin/organizations/${params.id}/signatures/${template.id}/deploy`}>
                                <Send className="h-4 w-4 mr-2" />
                                Deploy
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-md p-3 h-32 overflow-hidden bg-slate-50">
                        <div
                          className="text-xs scale-75 origin-top-left"
                          dangerouslySetInnerHTML={{ __html: template.html_content }}
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-0">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/super-admin/organizations/${params.id}/signatures/${template.id}/edit`}>
                          <Edit className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Link>
                      </Button>
                      <Button variant="default" size="sm" asChild>
                        <Link href={`/super-admin/organizations/${params.id}/signatures/${template.id}/deploy`}>
                          <Send className="h-3.5 w-3.5 mr-1" />
                          Deploy
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
