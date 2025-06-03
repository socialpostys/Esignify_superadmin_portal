import React from "react"
import { createServerSupabaseClient } from "./supabase-client"
import { getSession } from "./auth"

export enum ErrorSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

export interface ErrorDetails {
  message: string
  code?: string
  component?: string
  operation?: string
  severity: ErrorSeverity
  stack?: string
  context?: Record<string, any>
}

export class AppError extends Error {
  public code: string
  public component: string
  public operation: string
  public severity: ErrorSeverity
  public context: Record<string, any>

  constructor(details: ErrorDetails) {
    super(details.message)
    this.name = "AppError"
    this.code = details.code || "UNKNOWN_ERROR"
    this.component = details.component || "unknown"
    this.operation = details.operation || "unknown"
    this.severity = details.severity
    this.context = details.context || {}

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }

  // Convert to JSON for logging
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      component: this.component,
      operation: this.operation,
      severity: this.severity,
      stack: this.stack,
      context: this.context,
    }
  }
}

// Log error to database and console
export async function logError(error: Error | AppError | unknown, context?: Record<string, any>) {
  try {
    // Format error for logging
    let formattedError: Record<string, any>

    if (error instanceof AppError) {
      formattedError = error.toJSON()
    } else if (error instanceof Error) {
      formattedError = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: "UNKNOWN_ERROR",
        component: "unknown",
        operation: "unknown",
        severity: ErrorSeverity.ERROR,
        context: context || {},
      }
    } else {
      formattedError = {
        name: "UnknownError",
        message: String(error),
        code: "UNKNOWN_ERROR",
        component: "unknown",
        operation: "unknown",
        severity: ErrorSeverity.ERROR,
        context: context || {},
      }
    }

    // Log to console
    console.error("Application error:", formattedError)

    // Log to database
    try {
      const supabase = createServerSupabaseClient()
      const session = await getSession()

      await supabase.from("error_logs").insert({
        error_type: formattedError.name,
        message: formattedError.message,
        code: formattedError.code,
        component: formattedError.component,
        operation: formattedError.operation,
        severity: formattedError.severity,
        stack: formattedError.stack,
        context: formattedError.context,
        user_id: session?.userId,
        organization_id: session?.organizationId,
      })
    } catch (dbError) {
      console.error("Failed to log error to database:", dbError)
    }

    // For critical errors, you might want to send notifications
    if (formattedError.severity === ErrorSeverity.CRITICAL) {
      try {
        await sendErrorNotification(formattedError)
      } catch (notifyError) {
        console.error("Failed to send error notification:", notifyError)
      }
    }
  } catch (metaError) {
    console.error("Error in error logging system:", metaError)
  }
}

// Send notification for critical errors
async function sendErrorNotification(error: Record<string, any>) {
  // Implement notification logic (email, Slack, etc.)
  // This is a placeholder
  console.log("CRITICAL ERROR NOTIFICATION:", error)
}

// Create error handler middleware for API routes
export function withErrorHandler(handler: Function) {
  return async (req: Request) => {
    try {
      return await handler(req)
    } catch (error) {
      await logError(error, { url: req.url, method: req.method })

      // Return appropriate error response
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "An unexpected error occurred",
          code: error instanceof AppError ? error.code : "INTERNAL_SERVER_ERROR",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }
  }
}

// Create error boundary component for React
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <React.ErrorBoundary
      fallback={<div>Something went wrong. Please try again or contact support.</div>}
      onError={(error, info) => {
        logError(error, { componentStack: info.componentStack })
      }}
    >
      {children}
    </React.ErrorBoundary>
  )
}
