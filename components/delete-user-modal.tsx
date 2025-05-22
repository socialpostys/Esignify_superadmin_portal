"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { updateOrganization } from "@/lib/client-storage"
import type { User } from "@/lib/types"

interface DeleteUserModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  organizationId: string
}

export function DeleteUserModal({ isOpen, onClose, user, organizationId }: DeleteUserModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleDelete = () => {
    setError(null)

    if (!user) {
      setError("No user selected")
      return
    }

    setIsSubmitting(true)

    try {
      // Delete the user from the organization
      updateOrganization(organizationId, (org) => {
        const updatedUsers = (org.users || []).filter((u) => u.id !== user.id)

        return {
          ...org,
          users: updatedUsers,
          users_count: updatedUsers.length,
          updated_at: new Date().toISOString(),
        }
      })

      // Close the modal
      onClose()
    } catch (error) {
      console.error("Error deleting user:", error)
      setError(`Failed to delete user: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {user?.name || user?.email || "this user"}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete User"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
