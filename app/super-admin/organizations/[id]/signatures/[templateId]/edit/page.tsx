"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle } from "lucide-react"
import { getOrganization, updateOrganization } from "@/lib/client-storage"

export default function EditSignatureTemplatePage({ params }: { params: { id: string; templateId: string } }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [htmlContent, setHtmlContent] = useState("")
  const [isDefault, setIsDefault] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const fetchTemplate = () => {
      setIsLoading(true)
      try {
        // Get organization from client storage
        const org = getOrganization(params.id)
        if (!org) {
          throw new Error("Organization not found")
        }

        // Find template
        const template = (org.signature_templates || []).find((t: any) => t.id === params.templateId)
        if (!template) {
          throw new Error("Template not found")
        }

        // Set form values
        setName(template.name)
        setDescription(template.description || "")
        setHtmlContent(template.html_content)
        setIsDefault(template.is_default || false)
      } catch (error) {
        console.error("Error fetching template:", error)
        setError(`Failed to load template: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTemplate()
  }, [params.id, params.templateId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      // Validate inputs
      if (!name.trim()) {
        throw new Error("Template name is required")
      }

      if (!htmlContent.trim()) {
        throw new Error("HTML content is required")
      }

      // Update template
      updateOrganization(params.id, (org) => {
        const templates = org.signature_templates || []
        const updatedTemplates = templates.map((template: any) => {
          // If this is the default template, unset default on other templates
          if (isDefault && template.id !== params.templateId) {
            return { ...template, is_default: false }
          }

          // Update the target template
          if (template.id === params.templateId) {
            return {
              ...template,
              name,
              description,
              html_content: htmlContent,
              is_default: isDefault,
              updated_at: new Date().toISOString(),
            }
          }

          return template
        })

        return {
          ...org,
          signature_templates: updatedTemplates,
          updated_at: new Date().toISOString(),
        }
      })

      // Show success message
      setSuccess("Template updated successfully")
    } catch (err) {
      console.error("Error updating template:", err)
      setError(`Failed to update template: ${err instanceof Error ? err.message : String(err)}`)
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

  return (
    <DashboardLayout userRole="super-admin">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/super-admin/organizations/${params.id}/signatures`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Signature Template</h1>
            <p className="text-muted-foreground">Update an existing email signature template</p>
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

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
              <CardDescription>Update the basic information for this template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Standard Company Signature"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A brief description of this template"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="is-default" checked={isDefault} onCheckedChange={setIsDefault} />
                <Label htmlFor="is-default">Set as default template</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Template Content</CardTitle>
              <CardDescription>Update your signature template design</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="html" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="html">HTML</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="html" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="html">HTML Content</Label>
                    <Textarea
                      id="html"
                      value={htmlContent}
                      onChange={(e) => setHtmlContent(e.target.value)}
                      className="min-h-[300px] font-mono text-sm"
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Use variables like {`{{name}}`}, {`{{title}}`}, {`{{email}}`}, etc. for dynamic content
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="preview">
                  <div className="border rounded-md p-6">
                    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/super-admin/organizations/${params.id}/signatures`)}
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
