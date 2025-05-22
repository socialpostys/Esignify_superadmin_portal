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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle, Search, Users, User, Send } from "lucide-react"
import { getOrganization, updateOrganization } from "@/lib/client-storage"

export default function DeploySignaturePage({ params }: { params: { id: string; templateId: string } }) {
  const router = useRouter()
  const [organization, setOrganization] = useState<any>(null)
  const [template, setTemplate] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [deployMode, setDeployMode] = useState<"all" | "selected" | "test">("selected")
  const [testUser, setTestUser] = useState<any>(null)
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

        // Find template
        const foundTemplate = (org.signature_templates || []).find((t: any) => t.id === params.templateId)
        if (!foundTemplate) {
          throw new Error("Template not found")
        }

        setOrganization(org)
        setTemplate(foundTemplate)
        setUsers(org.users || [])
        setFilteredUsers(org.users || [])
      } catch (error) {
        console.error("Error fetching data:", error)
        setError(`Failed to load data: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id, params.templateId])

  useEffect(() => {
    // Filter users based on search query
    if (users.length > 0) {
      const filtered = users.filter((user) => {
        const searchString = `${user.name} ${user.email} ${user.department} ${user.title}`.toLowerCase()
        return searchString.includes(searchQuery.toLowerCase())
      })
      setFilteredUsers(filtered)
    }
  }, [searchQuery, users])

  useEffect(() => {
    // Handle select all checkbox
    if (selectAll) {
      setSelectedUsers(filteredUsers.map((user) => user.id))
    } else if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    }
  }, [selectAll])

  const handleUserSelect = (userId: string) => {
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId)
      } else {
        return [...prev, userId]
      }
    })
  }

  const handleSelectAllChange = () => {
    setSelectAll(!selectAll)
  }

  const handleTestUserSelect = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    setTestUser(user)
  }

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      let userIds: string[] = []

      if (deployMode === "all") {
        // Deploy to all users
        userIds = users.map((user) => user.id)
      } else if (deployMode === "selected") {
        // Deploy to selected users
        if (selectedUsers.length === 0) {
          throw new Error("Please select at least one user")
        }
        userIds = selectedUsers
      } else if (deployMode === "test") {
        // Deploy to test user
        if (!testUser) {
          throw new Error("Please select a test user")
        }
        userIds = [testUser.id]
      }

      // Update users with assigned signature
      updateOrganization(params.id, (org) => {
        const updatedUsers = (org.users || []).map((user: any) => {
          if (userIds.includes(user.id)) {
            return {
              ...user,
              has_signature: true,
              signature_template_id: params.templateId,
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
      setSuccess(`Signature deployed successfully to ${userIds.length} user${userIds.length !== 1 ? "s" : ""}`)
    } catch (err) {
      console.error("Error deploying signature:", err)
      setError(`Failed to deploy signature: ${err instanceof Error ? err.message : String(err)}`)
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

  if (!organization || !template) {
    return (
      <DashboardLayout userRole="super-admin">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Organization or template not found</AlertDescription>
        </Alert>
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
            <h1 className="text-3xl font-bold tracking-tight">Deploy Signature</h1>
            <p className="text-muted-foreground">Deploy the "{template.name}" signature to users</p>
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

        <Card>
          <CardHeader>
            <CardTitle>Template Preview</CardTitle>
            <CardDescription>This is the signature template that will be deployed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md p-6 bg-white">
              <div dangerouslySetInnerHTML={{ __html: template.html_content }} />
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleDeploy}>
          <Card>
            <CardHeader>
              <CardTitle>Deployment Options</CardTitle>
              <CardDescription>Choose how you want to deploy this signature</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                defaultValue="selected"
                onValueChange={(value) => setDeployMode(value as any)}
                className="space-y-4"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="selected">Selected Users</TabsTrigger>
                  <TabsTrigger value="all">All Users</TabsTrigger>
                  <TabsTrigger value="test">Test User</TabsTrigger>
                </TabsList>

                <TabsContent value="selected" className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search users..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="select-all" checked={selectAll} onCheckedChange={handleSelectAllChange} />
                      <Label htmlFor="select-all">Select All</Label>
                    </div>
                  </div>

                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No users found</p>
                    </div>
                  ) : (
                    <div className="border rounded-md divide-y max-h-[400px] overflow-y-auto">
                      {filteredUsers.map((user) => (
                        <div key={user.id} className="flex items-center p-3 hover:bg-slate-50">
                          <Checkbox
                            id={`user-${user.id}`}
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={() => handleUserSelect(user.id)}
                            className="mr-3"
                          />
                          <Label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer">
                            <div className="font-medium">{user.name || "Unnamed User"}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                            {(user.department || user.title) && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {user.department && <span>{user.department}</span>}
                                {user.department && user.title && <span> • </span>}
                                {user.title && <span>{user.title}</span>}
                              </div>
                            )}
                          </Label>
                          {user.has_signature && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full ml-2">
                              Has Signature
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground">
                    {selectedUsers.length} of {filteredUsers.length} users selected
                  </div>
                </TabsContent>

                <TabsContent value="all">
                  <div className="space-y-4">
                    <Alert>
                      <AlertDescription>
                        This will deploy the signature to all {users.length} users in the organization.
                      </AlertDescription>
                    </Alert>

                    <div className="flex items-center p-3 border rounded-md">
                      <Users className="h-5 w-5 mr-2 text-muted-foreground" />
                      <span>Deploy to all {users.length} users</span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="test" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select a test user</Label>
                    <div className="border rounded-md divide-y max-h-[400px] overflow-y-auto">
                      {users.map((user) => (
                        <div
                          key={user.id}
                          className={`flex items-center p-3 hover:bg-slate-50 cursor-pointer ${
                            testUser?.id === user.id ? "bg-slate-100" : ""
                          }`}
                          onClick={() => handleTestUserSelect(user.id)}
                        >
                          <User className="h-4 w-4 mr-3 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="font-medium">{user.name || "Unnamed User"}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                          {testUser?.id === user.id && <CheckCircle className="h-4 w-4 text-green-600" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  {testUser && (
                    <Alert className="bg-blue-50 border-blue-200">
                      <AlertDescription className="text-blue-700">
                        This will deploy the signature to {testUser.name || testUser.email} for testing purposes.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/super-admin/organizations/${params.id}/signatures`)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || (deployMode === "test" && !testUser)}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Deploy Signature
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
