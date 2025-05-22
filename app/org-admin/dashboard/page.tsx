"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, FileSignature, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { getOrganization } from "@/lib/client-storage"
import { getAzureSettings, getUsers, getSignatureTemplates } from "@/app/actions"

export default function OrgAdminDashboard() {
  const [organization, setOrganization] = useState<any>(null)
  const [azureSettings, setAzureSettings] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Load data on component mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)

        // Get organization ID from cookie
        const cookies = document.cookie.split(";").reduce(
          (acc, cookie) => {
            const [key, value] = cookie.trim().split("=")
            acc[key] = value
            return acc
          },
          {} as Record<string, string>,
        )

        const organizationId = cookies.organization_id

        if (organizationId) {
          // Get organization from localStorage
          const org = getOrganization(organizationId)
          setOrganization(org)

          // Get Azure settings
          const azureResult = await getAzureSettings()
          if (!azureResult.error) {
            setAzureSettings(azureResult.settings)
          }

          // Get users
          const usersResult = await getUsers()
          if (!usersResult.error) {
            setUsers(usersResult.users)
          }

          // Get signature templates
          const templatesResult = await getSignatureTemplates()
          if (!templatesResult.error) {
            setTemplates(templatesResult.templates)
          }
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Refresh data
  const refreshData = async () => {
    try {
      setRefreshing(true)

      // Get organization ID from cookie
      const cookies = document.cookie.split(";").reduce(
        (acc, cookie) => {
          const [key, value] = cookie.trim().split("=")
          acc[key] = value
          return acc
        },
        {} as Record<string, string>,
      )

      const organizationId = cookies.organization_id

      if (organizationId) {
        // Get organization from localStorage
        const org = getOrganization(organizationId)
        setOrganization(org)

        // Get Azure settings
        const azureResult = await getAzureSettings()
        if (!azureResult.error) {
          setAzureSettings(azureResult.settings)
        }

        // Get users
        const usersResult = await getUsers()
        if (!usersResult.error) {
          setUsers(usersResult.users)
        }

        // Get signature templates
        const templatesResult = await getSignatureTemplates()
        if (!templatesResult.error) {
          setTemplates(templatesResult.templates)
        }
      }
    } catch (error) {
      console.error("Error refreshing dashboard data:", error)
    } finally {
      setRefreshing(false)
    }
  }

  // Calculate stats
  const totalUsers = users.length
  const totalTemplates = templates.length
  const assignedUsers = users.filter((user) => user.has_signature).length
  const pendingUsers = totalUsers - assignedUsers

  // Stats for the dashboard
  const stats = [
    {
      title: "Total Users",
      value: totalUsers.toString(),
      icon: Users,
      description: "Active users in your organization",
    },
    {
      title: "Signature Templates",
      value: totalTemplates.toString(),
      icon: FileSignature,
      description: "Created templates",
    },
    {
      title: "Assigned Signatures",
      value: assignedUsers.toString(),
      icon: CheckCircle2,
      description: "Users with signatures",
    },
    {
      title: "Pending Assignments",
      value: pendingUsers.toString(),
      icon: AlertTriangle,
      description: "Users without signatures",
    },
  ]

  if (loading) {
    return (
      <DashboardLayout userRole="org-admin" orgName={organization?.name || "Loading..."}>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="org-admin" orgName={organization?.name || "Organization"}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Organization Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to {organization?.name || "your organization's"} signature management dashboard
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Azure AD Status</CardTitle>
              <CardDescription>Status of your Azure Active Directory connection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "h-3 w-3 rounded-full",
                      azureSettings?.is_connected ? "bg-green-500" : "bg-yellow-500",
                    )}
                  />
                  <span className="text-sm font-medium">
                    {azureSettings?.is_connected ? "Connected" : "Not Connected"}
                  </span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/org-admin/azure">Manage Connection</Link>
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Sync</span>
                  <span>{azureSettings?.last_sync ? new Date(azureSettings.last_sync).toLocaleString() : "Never"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Users Synced</span>
                  <span>{totalUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tenant ID</span>
                  <span className="truncate max-w-[200px]">{azureSettings?.tenant_id || "Not configured"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Recent signature assignments and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {organization?.recent_activities
                  ? organization.recent_activities.map((activity: any, i: number) => (
                      <div key={i} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-xs text-slate-500">{activity.user}</p>
                        </div>
                        <div className="text-xs text-slate-500">{activity.time}</div>
                      </div>
                    ))
                  : [
                      { action: "Signature assigned", user: "John Smith", time: "10 minutes ago" },
                      { action: "Template updated", user: "Marketing Team", time: "2 hours ago" },
                      {
                        action: "Users synced",
                        user: "System",
                        time: azureSettings?.last_sync ? new Date(azureSettings.last_sync).toLocaleString() : "Never",
                      },
                      { action: "Signature assigned", user: "Sarah Johnson", time: "Yesterday" },
                    ].map((activity, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-xs text-slate-500">{activity.user}</p>
                        </div>
                        <div className="text-xs text-slate-500">{activity.time}</div>
                      </div>
                    ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and actions</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-2">
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/org-admin/signatures/templates/new">
                  <FileSignature className="mr-2 h-4 w-4" />
                  Create Signature
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/org-admin/users">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Users
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/org-admin/azure">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Sync Users
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/org-admin/signatures/templates">
                  <FileSignature className="mr-2 h-4 w-4" />
                  View Templates
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
