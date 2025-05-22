"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { getOrganization, updateOrganization } from "@/lib/client-storage"

export default function AssignSignaturesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get("template")

  const [users, setUsers] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>(templateId || "")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchData = () => {
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

        // Get users and templates from organization
        const orgUsers = organization.users || []
        const orgTemplates = organization.signature_templates || []

        setUsers(orgUsers)
        setTemplates(orgTemplates)

        // Set selected template if provided in URL
        if (templateId && orgTemplates.some((t: any) => t.id === templateId)) {
          setSelectedTemplate(templateId)
        } else if (orgTemplates.length > 0) {
          // Default to first template if none specified
          setSelectedTemplate(orgTemplates[0].id)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        setError(`Failed to load data: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [templateId])

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

      if (selectedUsers.length === 0) {
        throw new Error("Please select at least one user")
      }

      // Get organization ID from localStorage
      const orgId = localStorage.getItem("currentOrganizationId")
      if (!orgId) {
        throw new Error("No organization selected")
      }

      // Update organization with assigned signatures
      updateOrganization(orgId, (org) => {
        const updatedUsers = (org.users || []).map((user: any) => {
          if (selectedUsers.includes(user.id)) {
            return {
              ...user,
              has_signature: true,
              signature_template_id: selectedTemplate,
              updated_at: new Date().toISOString(),
            }
          }
          return user
        })

        return {
          ...org,
          users: updatedUsers,
          updated_at: new Date().toISOString(),
        }
      })

      // Show success message
      setSuccess(`Successfully assigned signature to ${selectedUsers.length} user(s)`)

      // Clear selection
      setSelectedUsers([])
    } catch (err) {
      console.error("Error assigning signatures:", err)
      setError(`Failed to assign signatures: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const toggleAllUsers = () => {
    if (filteredUsers.length === selectedUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map((user) => user.id))
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (isLoading) {
    return (
      <DashboardLayout userRole="org-admin">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400 mr-2" />
          <p>Loading data...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="org-admin">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/org-admin/users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Assign Signatures</h1>
            <p className="text-muted-foreground">Assign signature templates to users</p>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Template</CardTitle>
              <CardDescription>Choose a signature template to assign</CardDescription>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">No templates available</p>
                  <Button asChild>
                    <Link href="/org-admin/signatures/templates/new">Create Template</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`border rounded-md p-4 cursor-pointer transition-colors ${
                        selectedTemplate === template.id ? "border-primary bg-primary/5" : "hover:border-gray-400"
                      }`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <div className="flex items-start gap-2">
                        <Checkbox
                          checked={selectedTemplate === template.id}
                          onCheckedChange={() => setSelectedTemplate(template.id)}
                        />
                        <div>
                          <h3 className="font-medium">{template.name}</h3>
                          {template.description && (
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {templates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Select Users</CardTitle>
                <CardDescription>Choose users to assign the signature to</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                </div>

                {users.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No users available</p>
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <div className="flex items-center gap-2 p-3 border-b bg-muted/50">
                      <Checkbox
                        checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                        onCheckedChange={toggleAllUsers}
                      />
                      <div className="grid grid-cols-12 w-full text-sm font-medium">
                        <div className="col-span-4">Name</div>
                        <div className="col-span-4">Email</div>
                        <div className="col-span-2">Department</div>
                        <div className="col-span-2">Status</div>
                      </div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                      {filteredUsers.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">No users match your search</div>
                      ) : (
                        filteredUsers.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center gap-2 p-3 border-b last:border-0 hover:bg-muted/50 cursor-pointer"
                            onClick={() => toggleUser(user.id)}
                          >
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={() => toggleUser(user.id)}
                            />
                            <div className="grid grid-cols-12 w-full text-sm">
                              <div className="col-span-4 truncate">{user.name || "N/A"}</div>
                              <div className="col-span-4 truncate">{user.email}</div>
                              <div className="col-span-2 truncate">{user.department || "N/A"}</div>
                              <div className="col-span-2">
                                {user.has_signature ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    Assigned
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                    Unassigned
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">{selectedUsers.length} user(s) selected</div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/org-admin/users")}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || selectedUsers.length === 0 || !selectedTemplate}>
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
              </CardFooter>
            </Card>
          )}
        </form>
      </div>
    </DashboardLayout>
  )
}
