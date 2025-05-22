"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, FileSignature, CheckCircle2 } from "lucide-react"

export default function SuperAdminDashboard() {
  // State to track total organizations
  const [orgCount, setOrgCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Check for organizations in localStorage on component mount
  useEffect(() => {
    setIsLoading(true)
    try {
      const storedOrgs = localStorage.getItem("newOrganizations")
      if (storedOrgs) {
        const orgs = JSON.parse(storedOrgs)
        setOrgCount(orgs.length)
      } else {
        // Default to 0 if no organizations found
        setOrgCount(0)
      }
    } catch (error) {
      console.error("Error reading organizations from localStorage:", error)
      // Default to 0 if there's an error
      setOrgCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Mock data for the dashboard
  const stats = [
    {
      title: "Total Organizations",
      value: isLoading ? "..." : orgCount.toString(),
      icon: Building2,
      description: "Active organizations",
    },
    {
      title: "Total Users",
      value: "0",
      icon: Users,
      description: "Across all organizations",
    },
    {
      title: "Signature Templates",
      value: "0",
      icon: FileSignature,
      description: "Created templates",
    },
    {
      title: "Azure Connections",
      value: "0",
      icon: CheckCircle2,
      description: "Active connections",
    },
  ]

  return (
    <DashboardLayout userRole="super-admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of all organizations and system status</p>
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
              <CardTitle>Recent Organizations</CardTitle>
              <CardDescription>Recently added or updated organizations</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <p>Loading organizations...</p>
                </div>
              ) : orgCount > 0 ? (
                <div className="space-y-4">
                  {(() => {
                    try {
                      const storedOrgs = localStorage.getItem("newOrganizations")
                      const orgs = storedOrgs ? JSON.parse(storedOrgs) : []
                      return orgs.slice(0, 4).map((org: any, i: number) => (
                        <div key={org.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                              {org.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{org.name}</p>
                              <p className="text-xs text-slate-500">Active • {org.users_count || 0} users</p>
                            </div>
                          </div>
                          <div className="text-xs text-slate-500">{new Date(org.created_at).toLocaleDateString()}</div>
                        </div>
                      ))
                    } catch (error) {
                      console.error("Error rendering organizations:", error)
                      return (
                        <div className="text-sm text-red-500">
                          Error loading organizations. Please refresh the page.
                        </div>
                      )
                    }
                  })()}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-500">No organizations found</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Azure Status</CardTitle>
              <CardDescription>Status of Azure AD connections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-sm text-slate-500">No Azure connections found</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
