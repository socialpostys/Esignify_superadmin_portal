"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ImageIcon,
  LinkIcon,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { createSignatureTemplate } from "@/app/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import Image from "next/image"

export default function NewSignaturePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [htmlContent, setHtmlContent] = useState(`<table>
  <tr>
    <td style="width: 80px; vertical-align: top;">
      <img src="{{logo_url}}" alt="Logo" style="width: 70px; height: auto;" />
    </td>
    <td style="padding-left: 10px; vertical-align: top;">
      <p style="margin: 0; font-weight: bold; font-size: 16px;">{{name}}</p>
      <p style="margin: 0; font-size: 14px;">{{title}}</p>
      <p style="margin: 0; font-size: 12px; color: #666;">{{email}} | {{phone}}</p>
      <div style="margin-top: 10px; font-size: 12px;">
        <p style="margin: 0;">{{company}}</p>
        <p style="margin: 0;">{{address_line_1}}</p>
        <p style="margin: 0;">{{address_line_2}}</p>
      </div>
    </td>
  </tr>
</table>`)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [blobWarning, setBlobWarning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check if we're in development mode to show appropriate warnings
  useEffect(() => {
    // In a real app, we would check if the Blob integration is available
    // For now, we'll just show a warning in development mode
    if (process.env.NODE_ENV === "development") {
      setBlobWarning(true)
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
      formData.append("folder", "signature-logos")

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

      // Update HTML content to use the new logo URL
      setHtmlContent((prevContent) => prevContent.replace(/{{logo_url}}/g, data.url))
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const formData = new FormData(e.currentTarget)
      formData.set("html_content", htmlContent)

      const result = await createSignatureTemplate(formData)

      if (result.error) {
        setError(result.error)
        setIsSubmitting(false)
      } else {
        router.push("/org-admin/signatures")
        router.refresh()
      }
    } catch (err) {
      console.error("Template creation error:", err)
      setError(`Failed to create template: ${err instanceof Error ? err.message : String(err)}`)
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout userRole="org-admin" orgName="Acme Inc">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/org-admin/signatures">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Signature Template</h1>
            <p className="text-muted-foreground">Design a new email signature template</p>
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

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Template Details</CardTitle>
                  <CardDescription>Basic information about the signature template</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name</Label>
                    <Input id="name" name="name" placeholder="Standard Signature" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Default signature for all employees"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="is_default" name="is_default" />
                    <Label htmlFor="is_default">Set as default template</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Signature Editor</CardTitle>
                  <CardDescription>Design your email signature</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-1 border-b pb-2">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                      <Underline className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="mx-1 h-6" />
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                      <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                      <AlignCenter className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                      <AlignRight className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="mx-1 h-6" />
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                  </div>

                  <Tabs defaultValue="wysiwyg">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="wysiwyg">Visual Editor</TabsTrigger>
                      <TabsTrigger value="html">HTML</TabsTrigger>
                    </TabsList>
                    <TabsContent value="wysiwyg" className="space-y-4">
                      <div className="min-h-[300px] rounded-md border p-4">
                        <div className="flex gap-4">
                          <div className="h-16 w-16 rounded-md bg-slate-200 flex items-center justify-center text-slate-500 overflow-hidden">
                            {logoUrl ? (
                              <Image
                                src={logoUrl || "/placeholder.svg"}
                                alt="Logo"
                                width={64}
                                height={64}
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              "Logo"
                            )}
                          </div>
                          <div>
                            <p className="font-bold">{"{{name}}"}</p>
                            <p>{"{{title}}"}</p>
                            <p className="text-sm text-slate-500">
                              {"{{email}}"} | {"{{phone}}"}
                            </p>
                            <div className="mt-2 text-sm">
                              <p>{"{{company}}"}</p>
                              <p>{"{{address_line_1}}"}</p>
                              <p>{"{{address_line_2}}"}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Dynamic Fields</Label>
                        <div className="flex flex-wrap gap-2">
                          {["{{name}}", "{{title}}", "{{email}}", "{{phone}}", "{{department}}"].map((field) => (
                            <Badge key={field} variant="outline" className="cursor-pointer">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="html">
                      <Textarea
                        className="font-mono text-xs"
                        rows={15}
                        value={htmlContent}
                        onChange={(e) => setHtmlContent(e.target.value)}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>Preview how your signature will look</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border p-6">
                    <div className="flex gap-4">
                      <div className="h-16 w-16 rounded-md bg-slate-200 flex items-center justify-center text-slate-500 overflow-hidden">
                        {logoUrl ? (
                          <Image
                            src={logoUrl || "/placeholder.svg"}
                            alt="Logo"
                            width={64}
                            height={64}
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          "Logo"
                        )}
                      </div>
                      <div>
                        <p className="font-bold">John Smith</p>
                        <p>Marketing Director</p>
                        <p className="text-sm text-slate-500">john.smith@acme.com | (555) 123-4567</p>
                        <div className="mt-2 text-sm">
                          <p>Acme Inc</p>
                          <p>123 Business Street, Suite 100</p>
                          <p>San Francisco, CA 94107</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Variables</CardTitle>
                  <CardDescription>Customize dynamic content in your signature</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="logo">Company Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-md border border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                        {logoUrl ? (
                          <Image
                            src={logoUrl || "/placeholder.svg"}
                            alt="Logo"
                            width={64}
                            height={64}
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-slate-400" />
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
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Company Information</Label>
                    <div className="space-y-2">
                      <Input placeholder="Company Name" defaultValue="Acme Inc" />
                      <Input placeholder="Address Line 1" defaultValue="123 Business Street, Suite 100" />
                      <Input placeholder="Address Line 2" defaultValue="San Francisco, CA 94107" />
                      <Input placeholder="Website" defaultValue="www.acme.com" />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Social Media</Label>
                      <Button type="button" variant="ghost" size="sm">
                        Add Link
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Input placeholder="LinkedIn URL" />
                      <Input placeholder="Twitter URL" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => router.push("/org-admin/signatures")}>
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
