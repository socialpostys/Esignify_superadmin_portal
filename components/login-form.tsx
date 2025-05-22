"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signIn } from "@/app/actions"
import { setPersistentCookie, getCookie } from "@/lib/client-storage"

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Check for existing login on component mount
  useEffect(() => {
    const userRole = getCookie("user_role")
    const userId = getCookie("user_id")

    if (userRole && userId) {
      // User is already logged in, redirect to appropriate dashboard
      if (userRole === "super_admin") {
        router.push("/super-admin/dashboard")
      } else if (userRole === "org_admin") {
        router.push("/org-admin/dashboard")
      }
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const formData = new FormData(e.currentTarget)
      const email = formData.get("email") as string
      const password = formData.get("password") as string

      // Special case for admin login
      if (email === "admin" && password === "admin123") {
        try {
          const response = await fetch("/api/auth/admin-login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || "Admin login failed")
          }

          // Set persistent cookies
          setPersistentCookie("user_role", "super_admin")
          setPersistentCookie("user_id", "admin-user-id")
          setPersistentCookie("organization_id", "system-org-id")

          // Redirect to the dashboard
          router.push(data.redirectTo || "/super-admin/dashboard")
          return
        } catch (adminError) {
          console.error("Admin login error:", adminError)
          setError(`Admin login failed: ${adminError instanceof Error ? adminError.message : String(adminError)}`)
          setIsLoading(false)
          return
        }
      }

      // Regular login for non-admin users
      const result = await signIn(formData)

      if (result?.error) {
        console.error("Login error:", result.error)
        setError(result.error)
        setIsLoading(false)
      } else {
        // Set persistent cookies on client side as well
        const orgs = JSON.parse(localStorage.getItem("newOrganizations") || "[]")
        const org = orgs.find((o: any) => o.adminEmail === email)

        if (org) {
          setPersistentCookie("user_role", "org_admin")
          setPersistentCookie("user_id", email)
          setPersistentCookie("organization_id", org.id)
          router.push("/org-admin/dashboard")
        }
      }
    } catch (err) {
      console.error("Unexpected login error:", err)
      setError(`An unexpected error occurred. Please try again.`)
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Username or Email</Label>
            <Input id="email" name="email" type="text" placeholder="Username or email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" placeholder="••••••••" required />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
