"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PlusCircle, Search, MoreHorizontal, FileSignature, UserPlus, Loader2 } from "lucide-react"
import { getOrganization } from "@/lib/client-storage"

export default function OrganizationUsersPage({ params }: { params: { id: string } }) {
  const [organization, setOrganization] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

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
      } catch (error) {
        console.error("Error fetching data:", error)
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
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Organization not found</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="super-admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
            <p className="text-muted-foreground">{organization.domain}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href={`/super-admin/organizations/${params.id}/users/add`}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/super-admin/organizations/${params.id}/users/assign`}>
                <FileSignature className="mr-2 h-4 w-4" />
                Assign Signatures
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/super-admin/organizations/${params.id}`}>Overview</Link>
          </Button>
          <Button variant="default" size="sm">
            Users
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/super-admin/organizations/${params.id}/azure-settings`}>Azure Integration</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/super-admin/organizations/${params.id}/signatures`}>Signatures</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage users for this organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-4">
              <Search className="mr-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground mb-4">No users found</p>
                <Button asChild>
                  <Link href={`/super-admin/organizations/${params.id}/users/add`}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add User
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Signature</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name || "—"}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.department || "—"}</TableCell>
                        <TableCell>{user.title || "—"}</TableCell>
                        <TableCell>
                          {user.has_signature ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Assigned
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              Not Assigned
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.is_active ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/super-admin/organizations/${params.id}/users/${user.id}`}>View User</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/super-admin/organizations/${params.id}/users/${user.id}/edit`}>
                                  Edit User
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/super-admin/organizations/${params.id}/users/${user.id}/assign`}>
                                  Assign Signature
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">Delete User</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
