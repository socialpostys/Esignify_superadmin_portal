"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle, Search } from "lucide-react"
import { getOrganization, updateOrganization } from "@/lib/client-storage"

export default function AssignSignaturesPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [organization, setOrganization] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
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

        setOrganization(org)
        setUsers(org.users || [])
        setFilteredUsers(org.users || [])
        setTemplates(org.signature_templates || [])

        // Set default template if available
        if (org.signature_templates?.length > 0) {
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
  }, [params.id])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredUsers(
        users.filter(
          (user) =>
            user.name?.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            user.department?.toLowerCase().includes(query) ||
            user.title?.toLowerCase().includes(query),
        ),
      )
    }
  }, [searchQuery, users])

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map((user) => user.id))
    }
  }

  const toggleSelectUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId))
    } else {
      setSelectedUsers([...selectedUsers, userId])
    }
  }

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

      // Update users with assigned signature
      updateOrganization(params.id, (org) => {
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
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/super-admin/organizations/${params.id}/users`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Assign Signatures</h1>
            <p className="text-muted-foreground">Assign signature templates to multiple users</p>
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
                        </div>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </CardContent>
          </Card>

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
                      onCheckedChange={toggleSelectAll}
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
                          onClick={() => toggleSelectUser(user.id)}
                        >
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={() => toggleSelectUser(user.id)}
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
          </Card>

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">{selectedUsers.length} user(s) selected</div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/super-admin/organizations/${params.id}/users`)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || selectedUsers.length === 0 || !selectedTemplate || templates.length === 0}
              >
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
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
