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
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"

export default function SuperAdminSettingsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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
    <DashboardLayout userRole="super-admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage system-wide settings and preferences</p>
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
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Manage basic system settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="systemName">System Name</Label>
                    <Input id="systemName" defaultValue="Signify" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Admin Email</Label>
                    <Input id="adminEmail" type="email" defaultValue="admin@signify.com" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input id="supportEmail" type="email" defaultValue="support@signify.com" />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                      <p className="text-sm text-slate-500">Put the system in maintenance mode</p>
                    </div>
                    <Switch id="maintenanceMode" />
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

            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage security and authentication settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="passwordPolicy">Password Policy</Label>
                    <select
                      id="passwordPolicy"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="standard">Standard (8+ characters)</option>
                      <option value="strong">Strong (10+ chars, special characters)</option>
                      <option value="very-strong">Very Strong (12+ chars, mixed case, numbers, special)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input id="sessionTimeout" type="number" defaultValue="60" min="5" max="1440" />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="twoFactorAuth">Require Two-Factor Authentication</Label>
                      <p className="text-sm text-slate-500">Enforce 2FA for all admin accounts</p>
                    </div>
                    <Switch id="twoFactorAuth" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="ipRestriction">IP Restriction</Label>
                      <p className="text-sm text-slate-500">Restrict access to specific IP addresses</p>
                    </div>
                    <Switch id="ipRestriction" />
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

            <TabsContent value="appearance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance Settings</CardTitle>
                  <CardDescription>Customize the look and feel of the platform</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Default Theme</Label>
                    <select
                      id="theme"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input id="primaryColor" type="color" defaultValue="#0f172a" className="w-16 p-1" />
                      <Input defaultValue="#0f172a" className="flex-1" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">Logo URL</Label>
                    <Input id="logoUrl" placeholder="https://example.com/logo.png" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customCss">Custom CSS</Label>
                    <Textarea
                      id="customCss"
                      placeholder="/* Add your custom CSS here */"
                      className="font-mono"
                      rows={5}
                    />
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

            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Configure system notifications and alerts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="newOrg" className="cursor-pointer">
                          New Organization Created
                        </Label>
                        <Switch id="newOrg" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="newUser" className="cursor-pointer">
                          New User Registered
                        </Label>
                        <Switch id="newUser" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="securityAlert" className="cursor-pointer">
                          Security Alerts
                        </Label>
                        <Switch id="securityAlert" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="systemUpdates" className="cursor-pointer">
                          System Updates
                        </Label>
                        <Switch id="systemUpdates" />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="smtpServer">SMTP Server</Label>
                    <Input id="smtpServer" placeholder="smtp.example.com" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input id="smtpPort" placeholder="587" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpSecurity">Security</Label>
                      <select
                        id="smtpSecurity"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="tls">TLS</option>
                        <option value="ssl">SSL</option>
                        <option value="none">None</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpUsername">SMTP Username</Label>
                    <Input id="smtpUsername" placeholder="username" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpPassword">SMTP Password</Label>
                    <Input id="smtpPassword" type="password" placeholder="••••••••" />
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
