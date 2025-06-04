"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  Users,
  FileSignature,
  Settings,
  LogOut,
  LayoutDashboard,
  PlusCircle,
  CloudIcon as Azure,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole: "super-admin" | "org-admin"
  orgName?: string
}

export function DashboardLayout({ children, userRole, orgName }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [currentOrg, setCurrentOrg] = useState(orgName || "Super Admin")

  const superAdminNavItems = [
    {
      title: "Dashboard",
      href: "/super-admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Organizations",
      href: "/super-admin/organizations",
      icon: Building2,
    },
    {
      title: "Add Organization",
      href: "/super-admin/organizations/new",
      icon: PlusCircle,
    },
    {
      title: "Settings",
      href: "/super-admin/settings",
      icon: Settings,
    },
  ]

  const orgAdminNavItems = [
    {
      title: "Dashboard",
      href: "/org-admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Domain",
      href: "/org-admin/domain",
      icon: Globe,
    },
    {
      title: "DNS",
      href: "/org-admin/dns",
      icon: Globe,
    },
    {
      title: "Users",
      href: "/org-admin/users",
      icon: Users,
    },
    {
      title: "Signatures",
      href: "/org-admin/signatures",
      icon: FileSignature,
    },
    {
      title: "Azure Integration",
      href: "/org-admin/azure",
      icon: Azure,
    },
    {
      title: "Settings",
      href: "/org-admin/settings",
      icon: Settings,
    },
  ]

  const navItems = userRole === "super-admin" ? superAdminNavItems : orgAdminNavItems

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-slate-50">
        <Sidebar>
          <SidebarHeader className="border-b border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-white">S</div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Signify</span>
                <span className="text-xs text-slate-500">{currentOrg}</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="border-t border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Avatar" />
                  <AvatarFallback>{userRole === "super-admin" ? "SA" : "OA"}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {userRole === "super-admin" ? "Super Admin" : "Org Admin"}
                  </span>
                  <span className="text-xs text-slate-500">
                    {userRole === "super-admin" ? "admin" : "admin@example.com"}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <LogOut className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-14 items-center gap-4 border-b border-slate-200 bg-white px-4 sm:h-16 sm:px-6">
            <SidebarTrigger />
            <div className="ml-auto flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/">Sign Out</Link>
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
