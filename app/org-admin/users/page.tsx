"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Search, UserPlus, FileSignature } from "lucide-react"
import Link from "next/link"
import { getOrganization } from "@/lib/client-storage"

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = () => {
      setIsLoading(true)
      try {
        // Get organization ID from localStorage
        const orgId = localStorage.getItem("currentOrganizationId")
        if (!orgId) {
          console.error("No organization selected")
          setUsers([])
          setFilteredUsers([])
          return
        }

        // Get organization from client storage
        const organization = getOrganization(orgId)
        if (!organization) {
          console.error("Organization not found")
          setUsers([])
          setFilteredUsers([])
          return
        }

        // Get users from organization
        const orgUsers = organization.users || []
        setUsers(orgUsers)
        setFilteredUsers(orgUsers)
      } catch (error) {
        console.error("Error fetching users:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [])

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

  return (
    <DashboardLayout userRole="org-admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground">Manage your organization's users</p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/org-admin/users/assign">
                <FileSignature className="mr-2 h-4 w-4" />
                Assign Signatures
              </Link>
            </Button>
            <Button asChild>
              <Link href="/org-admin/users/import">
                <UserPlus className="mr-2 h-4 w-4" />
                Import Users
              </Link>
            </Button>
            <Button asChild>
              <Link href="/org-admin/users/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add User
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>View and manage all users in your organization</CardDescription>
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

            {isLoading ? (
              <div className="flex justify-center py-8">
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground mb-4">No users found</p>
                <Button asChild>
                  <Link href="/org-admin/users/new">
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
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/org-admin/users/${user.id}`}>View</Link>
                          </Button>
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
