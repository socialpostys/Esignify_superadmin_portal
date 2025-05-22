"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getOrganization, updateOrganization } from "@/lib/client-storage"
import { v4 as uuidv4 } from "uuid"
import type { User } from "@/lib/types"

export default function AddUserPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    title: "",
    role: "user",
    password: "",
    confirmPassword: "",
  })

  // Password validation states
  const [passwordValidation, setPasswordValidation] = useState({
    isLengthValid: false,
    doPasswordsMatch: false,
    showValidation: false,
  })

  // Update password validation whenever password or confirmPassword changes
  useEffect(() => {
    setPasswordValidation({
      isLengthValid: formData.password.length >= 8,
      doPasswordsMatch: formData.password === formData.confirmPassword && formData.confirmPassword !== "",
      showValidation: formData.password !== "" || formData.confirmPassword !== "",
    })
  }, [formData.password, formData.confirmPassword])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      // Validate form data
      if (!formData.name.trim()) {
        throw new Error("Name is required")
      }

      if (!formData.email.trim()) {
        throw new Error("Email is required")
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        throw new Error("Please enter a valid email address")
      }

      // Validate password
      if (!formData.password) {
        throw new Error("Password is required")
      }

      if (!passwordValidation.isLengthValid) {
        throw new Error("Password must be at least 8 characters long")
      }

      if (!passwordValidation.doPasswordsMatch) {
        throw new Error("Passwords do not match")
      }

      // Get the organization
      const organization = getOrganization(params.id)
      if (!organization) {
        throw new Error("Organization not found")
      }

      // Check if user with this email already exists
      if (organization.users?.some((user) => user.email === formData.email)) {
        throw new Error("A user with this email already exists")
      }

      // Create new user
      const newUser: User = {
        id: uuidv4(),
        organization_id: params.id,
        name: formData.name,
        email: formData.email,
        department: formData.department,
        title: formData.title,
        role: formData.role as "user" | "org_admin",
        password: formData.password, // In a real app, this would be hashed
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Update organization with new user
      updateOrganization(params.id, (org) => {
        return {
          ...org,
          users: [...(org.users || []), newUser],
          users_count: (org.users?.length || 0) + 1,
          updated_at: new Date().toISOString(),
        }
      })

      // Show success message
      setSuccess(true)

      // Reset form
      setFormData({
        name: "",
        email: "",
        department: "",
        title: "",
        role: "user",
        password: "",
        confirmPassword: "",
      })

      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/super-admin/organizations/${params.id}/users`)
      }, 1500)
    } catch (err) {
      console.error("Error adding user:", err)
      setError(err instanceof Error ? err.message : "Failed to add user")
    } finally {
      setIsSubmitting(false)
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Add User</h1>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>User has been added successfully. Redirecting...</AlertDescription>
          </Alert>
        )}

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Add a new user to the organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john.smith@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
                {passwordValidation.showValidation && (
                  <div className="text-sm mt-1 flex items-center gap-1">
                    {passwordValidation.isLengthValid ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={passwordValidation.isLengthValid ? "text-green-600" : "text-red-600"}>
                      Password must be at least 8 characters
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
                {passwordValidation.showValidation && formData.confirmPassword && (
                  <div className="text-sm mt-1 flex items-center gap-1">
                    {passwordValidation.doPasswordsMatch ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={passwordValidation.doPasswordsMatch ? "text-green-600" : "text-red-600"}>
                      Passwords {passwordValidation.doPasswordsMatch ? "match" : "do not match"}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  name="department"
                  placeholder="Marketing"
                  value={formData.department}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Marketing Director"
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">User Role</Label>
                <Select value={formData.role} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Regular User</SelectItem>
                    <SelectItem value="org_admin">Organization Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" asChild>
                <Link href={`/super-admin/organizations/${params.id}/users`}>Cancel</Link>
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !passwordValidation.isLengthValid || !passwordValidation.doPasswordsMatch}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add User
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}
