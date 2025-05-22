"use client"

import type React from "react"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, Upload } from "lucide-react"
import Image from "next/image"
import { useRef } from "react"

export default function OrgAdminSettingsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

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
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setSuccess("Settings updated successfully")
    }, 1000)
  }

  return (
    <DashboardLayout userRole="org-admin" orgName="Acme Inc">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
          <p className="text-muted-foreground">Manage your organization settings and preferences</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="signatures">Signatures</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Manage basic organization settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input id="orgName" defaultValue="Acme Inc" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="domain">Domain</Label>
                    <Input id="domain" defaultValue="acme.com" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Admin Email</Label>
                    <Input id="adminEmail" type="email" defaultValue="admin@acme.com" />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoAssign">Auto-Assign Signatures</Label>
                      <p className="text-sm text-slate-500">Automatically assign default signature to new users</p>
                    </div>
                    <Switch id="autoAssign" defaultChecked />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
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
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="branding" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Branding Settings</CardTitle>
                  <CardDescription>Customize your organization's branding</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="logo">Organization Logo</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input id="primaryColor" type="color" defaultValue="#0f172a" className="w-16 p-1" />
                      <Input defaultValue="#0f172a" className="flex-1" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input id="secondaryColor" type="color" defaultValue="#6366f1" className="w-16 p-1" />
                      <Input defaultValue="#6366f1" className="flex-1" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl">Website URL</Label>
                    <Input id="websiteUrl" placeholder="https://acme.com" />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
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
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="signatures" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Signature Settings</CardTitle>
                  <CardDescription>Configure default signature settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultTemplate">Default Signature Template</Label>
                    <select
                      id="defaultTemplate"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="standard">Standard Signature</option>
                      <option value="marketing">Marketing Team</option>
                      <option value="sales">Sales Department</option>
                      <option value="executive">Executive Team</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enforceSignatures">Enforce Signatures</Label>
                      <p className="text-sm text-slate-500">Require all users to use approved signatures</p>
                    </div>
                    <Switch id="enforceSignatures" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="serverSide">Server-Side Deployment</Label>
                      <p className="text-sm text-slate-500">Deploy signatures via Exchange transport rules</p>
                    </div>
                    <Switch id="serverSide" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="allowEdits">Allow User Edits</Label>
                      <p className="text-sm text-slate-500">Allow users to edit their signatures</p>
                    </div>
                    <Switch id="allowEdits" />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
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
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Settings</CardTitle>
                  <CardDescription>Configure user-related settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoProvision">Auto-Provision Users</Label>
                      <p className="text-sm text-slate-500">Automatically create users from Azure AD</p>
                    </div>
                    <Switch id="autoProvision" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="syncDisabled">Sync Disabled Users</Label>
                      <p className="text-sm text-slate-500">Include disabled users in Azure AD sync</p>
                    </div>
                    <Switch id="syncDisabled" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="userNotifications">User Notifications</Label>
                      <p className="text-sm text-slate-500">Send email notifications to users</p>
                    </div>
                    <Switch id="userNotifications" defaultChecked />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="syncFrequency">Azure AD Sync Frequency</Label>
                    <select
                      id="syncFrequency"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="manual">Manual Only</option>
                    </select>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
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
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </DashboardLayout>
  )
}
