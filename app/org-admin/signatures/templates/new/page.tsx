"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { v4 as uuidv4 } from "uuid"
import { getOrganization, updateOrganization } from "@/lib/client-storage"

export default function NewSignatureTemplatePage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [htmlContent, setHtmlContent] =
    useState(`<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5;">
<div>
  <strong>{{name}}</strong> | {{title}}
</div>
<div>{{company}}</div>
<div>Email: {{email}} | Phone: {{phone}}</div>
<div style="margin-top: 10px; border-top: 1px solid #ccc; padding-top: 10px;">
  <img src="{{logo}}" alt="Company Logo" style="max-height: 50px;" />
</div>
</div>`)
  const [isDefault, setIsDefault] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate inputs
      if (!name.trim()) {
        throw new Error("Template name is required")
      }

      if (!htmlContent.trim()) {
        throw new Error("HTML content is required")
      }

      // Get organization ID from localStorage
      const orgId = localStorage.getItem("currentOrganizationId")
      if (!orgId) {
        throw new Error("No organization selected")
      }

      // Create new template
      const newTemplate = {
        id: uuidv4(),
        name,
        description,
        html_content: htmlContent,
        is_default: isDefault,
        organization_id: orgId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Get organization from client storage
      const organization = getOrganization(orgId)
      if (!organization) {
        throw new Error("Organization not found")
      }

      // Update organization with new template
      updateOrganization(orgId, (org) => {
        const templates = org.signature_templates || []

        // If this is the default template, unset default on other templates
        if (isDefault) {
          templates.forEach((template: any) => {
            template.is_default = false
          })
        }

        return {
          ...org,
          signature_templates: [...templates, newTemplate],
          templates_count: (org.templates_count || 0) + 1,
          updated_at: new Date().toISOString(),
        }
      })

      // Redirect to templates list
      router.push("/org-admin/signatures/templates")
    } catch (err) {
      console.error("Error creating template:", err)
      setError(`Failed to create template: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout userRole="org-admin">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/org-admin/signatures/templates">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Signature Template</h1>
            <p className="text-muted-foreground">Create a new email signature template</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
              <CardDescription>Enter the basic information for this template</CardDescription>
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
              <CardDescription>Design your signature template</CardDescription>
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
              onClick={() => router.push("/org-admin/signatures/templates")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Template"
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
