"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, Trash, Users, CloudIcon, Building2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import type { Organization } from "@/lib/types"

export default function OrganizationDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrganization = () => {
      setIsLoading(true)
      try {
        // Get the organization from localStorage
        const storedOrgs = localStorage.getItem("newOrganizations")
        if (storedOrgs) {
          const orgs = JSON.parse(storedOrgs)
          const org = orgs.find((o: any) => o.id === params.id)
          if (org) {
            setOrganization(org)
          } else {
            setError("Organization not found")
          }
        } else {
          setError("No organizations available")
        }
      } catch (error) {
        console.error("Error fetching organization:", error)
        setError(`Failed to load organization: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrganization()
  }, [params.id])

  if (isLoading) {
    return (
      <DashboardLayout userRole="super-admin">
        <div className="flex items-center justify-center h-64">
          <p>Loading organization details...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !organization) {
    return (
      <DashboardLayout userRole="super-admin">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/super-admin/organizations">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Organization Details</h1>
          </div>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error || "Organization not found"}</AlertDescription>
          </Alert>
          <Button asChild>
            <Link href="/super-admin/organizations">Go Back</Link>
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="super-admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/super-admin/organizations">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
              <p className="text-muted-foreground">{organization.domain}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/super-admin/organizations/${params.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                // Delete organization
                const storedOrgs = localStorage.getItem("newOrganizations")
                if (storedOrgs) {
                  const orgs = JSON.parse(storedOrgs)
                  const updatedOrgs = orgs.filter((o: any) => o.id !== params.id)
                  localStorage.setItem("newOrganizations", JSON.stringify(updatedOrgs))
                  router.push("/super-admin/organizations")
                }
              }}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="azure">Azure Integration</TabsTrigger>
            <TabsTrigger value="signatures">Signatures</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Organization Information</CardTitle>
                <CardDescription>Basic details about the organization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="h-20 w-20 rounded-md border border-slate-200 flex items-center justify-center overflow-hidden">
                    {organization.logo_url ? (
                      <Image
                        src={organization.logo_url || "/placeholder.svg"}
                        alt={`${organization.name} logo`}
                        width={80}
                        height={80}
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <Building2 className="h-8 w-8 text-slate-300" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">{organization.name}</h3>
                    <p className="text-sm text-slate-500">{organization.domain}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="bg-slate-100">
                        {organization.users_count || 0} Users
                      </Badge>
                      <Badge variant="outline" className="bg-slate-100">
                        {organization.templates_count || 0} Templates
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Created</p>
                    <p className="text-slate-500">{new Date(organization.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="font-medium">Last Updated</p>
                    <p className="text-slate-500">{new Date(organization.updated_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="font-medium">Primary Domain</p>
                    <p className="text-slate-500">{organization.domain}</p>
                  </div>
                  <div>
                    <p className="font-medium">Azure Status</p>
                    <Badge
                      variant="outline"
                      className={
                        organization.azure_status === "Connected"
                          ? "bg-green-100 text-green-700"
                          : organization.azure_status === "Error"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                      }
                    >
                      {organization.azure_status || "Pending"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" asChild>
                  <Link href={`/super-admin/organizations/${params.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Details
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Admin Information</CardTitle>
                  <CardDescription>Organization administrator contact details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium text-sm">Admin Name</p>
                      <p>{organization.adminName || "Not set"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Admin Email</p>
                      <p>{organization.adminEmail || "Not set"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks for this organization</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href={`/super-admin/organizations/${params.id}/users`}>
                      <Users className="mr-2 h-4 w-4" />
                      Manage Users
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href={`/super-admin/organizations/${params.id}/azure-settings`}>
                      <CloudIcon className="mr-2 h-4 w-4" />
                      Configure Azure
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href={`/org/${organization.domain}/login`}>
                      <Building2 className="mr-2 h-4 w-4" />
                      Go to Org Login
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>User management for this organization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <h3 className="text-lg font-medium">No Users Added</h3>
                  <p className="text-sm text-slate-500 mt-1">This organization doesn't have any users yet.</p>
                  <Button className="mt-4" asChild>
                    <Link href={`/super-admin/organizations/${params.id}/users`}>Manage Users</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="azure">
            <Card>
              <CardHeader>
                <CardTitle>Azure AD Integration</CardTitle>
                <CardDescription>Azure Active Directory configuration for this organization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <CloudIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <h3 className="text-lg font-medium">Azure AD Not Configured</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Configure Azure AD integration to enable user synchronization.
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href={`/super-admin/organizations/${params.id}/azure-settings`}>Configure Azure</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signatures">
            <Card>
              <CardHeader>
                <CardTitle>Signature Templates</CardTitle>
                <CardDescription>Email signature templates for this organization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <AlertTriangle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <h3 className="text-lg font-medium">No Templates Found</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    This organization doesn't have any signature templates yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
