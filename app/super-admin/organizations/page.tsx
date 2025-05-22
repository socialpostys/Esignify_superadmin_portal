"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Search, MoreHorizontal, CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { Organization } from "@/lib/types"

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Function to delete an organization
  const deleteOrganization = (id: string) => {
    try {
      const storedOrgs = localStorage.getItem("newOrganizations")
      if (storedOrgs) {
        const orgs = JSON.parse(storedOrgs)
        const updatedOrgs = orgs.filter((o: any) => o.id !== id)
        localStorage.setItem("newOrganizations", JSON.stringify(updatedOrgs))
        setOrganizations(updatedOrgs)
      }
    } catch (error) {
      console.error("Error deleting organization:", error)
      setError("Failed to delete organization")
    }
  }

  // Function to refresh organizations from localStorage
  const refreshOrganizations = () => {
    setIsLoading(true)
    try {
      const storedOrgs = localStorage.getItem("newOrganizations")
      if (storedOrgs) {
        const localOrgs = JSON.parse(storedOrgs)
        setOrganizations(localOrgs)
        console.log("Refreshed organizations from localStorage:", localOrgs.length)
      } else {
        setOrganizations([])
      }
      setError(null)
    } catch (storageError) {
      console.error("Error reading from localStorage:", storageError)
      setError(
        `Failed to load organizations: ${storageError instanceof Error ? storageError.message : String(storageError)}`,
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Filtered organizations based on search query
  const filteredOrganizations = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.domain.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  useEffect(() => {
    // Fetch organizations from localStorage
    refreshOrganizations()

    // Set a timeout to stop the loading state in case of any issues
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false)
        setError("Loading timed out. Please try refreshing the page.")
      }
    }, 5000) // 5 seconds timeout

    return () => clearTimeout(timeoutId)
  }, [])

  return (
    <DashboardLayout userRole="super-admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
            <p className="text-muted-foreground">Manage all organizations in the system</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={refreshOrganizations} disabled={isLoading}>
              <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button asChild>
              <Link href="/super-admin/organizations/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Organization
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>All Organizations</CardTitle>
            <CardDescription>View and manage all organizations in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search organizations..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline">Filter</Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400 mr-2" />
                <p>Loading organizations...</p>
              </div>
            ) : filteredOrganizations.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Templates</TableHead>
                      <TableHead>Azure Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrganizations.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium">{org.name}</TableCell>
                        <TableCell>{org.domain}</TableCell>
                        <TableCell>{org.users_count || 0}</TableCell>
                        <TableCell>{org.templates_count || 0}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "bg-opacity-10",
                              org.azure_status === "Connected" && "bg-green-100 text-green-700 border-green-200",
                              org.azure_status === "Pending" && "bg-yellow-100 text-yellow-700 border-yellow-200",
                              org.azure_status === "Error" && "bg-red-100 text-red-700 border-red-200",
                            )}
                          >
                            {org.azure_status === "Connected" && <CheckCircle className="mr-1 h-3 w-3" />}
                            {org.azure_status === "Error" && <XCircle className="mr-1 h-3 w-3" />}
                            {org.azure_status || "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(org.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>
                                <Link href={`/super-admin/organizations/${org.id}`} className="flex w-full">
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Link href={`/super-admin/organizations/${org.id}/edit`} className="flex w-full">
                                  Edit Organization
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Link href={`/super-admin/organizations/${org.id}/users`} className="flex w-full">
                                  Manage Users
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Link href={`/super-admin/organizations/${org.id}/azure`} className="flex w-full">
                                  Azure Settings
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={() => deleteOrganization(org.id)}>
                                Delete Organization
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-8 text-center">
                <h3 className="text-lg font-medium">No organizations found</h3>
                <p className="mt-1 text-sm text-muted-foreground">Get started by creating a new organization.</p>
                <Button asChild className="mt-4">
                  <Link href="/super-admin/organizations/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Organization
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
