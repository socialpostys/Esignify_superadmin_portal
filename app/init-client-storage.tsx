"use client"

import { useEffect } from "react"
import { initializeDefaultOrganization } from "@/lib/client-storage"

export function InitClientStorage() {
  useEffect(() => {
    // Initialize default organization if none exists
    initializeDefaultOrganization()
  }, [])

  return null
}
