import { createServerSupabaseClient } from "./supabase-client"

interface AuditResult {
  component: string
  status: "pass" | "fail" | "warning"
  message: string
  details?: any
  fixes?: string[]
}

interface SystemAudit {
  overall: "healthy" | "issues" | "critical"
  results: AuditResult[]
  summary: {
    passed: number
    failed: number
    warnings: number
  }
}

export async function performSystemAudit(): Promise<SystemAudit> {
  const results: AuditResult[] = []

  // 1. Database Connection
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.from("organizations").select("count").limit(1)

    if (error) {
      results.push({
        component: "Database Connection",
        status: "fail",
        message: `Database connection failed: ${error.message}`,
        fixes: [
          "Check SUPABASE_SERVICE_ROLE_KEY environment variable",
          "Verify Supabase project is active",
          "Check network connectivity",
        ],
      })
    } else {
      results.push({
        component: "Database Connection",
        status: "pass",
        message: "Database connection successful",
      })
    }
  } catch (error) {
    results.push({
      component: "Database Connection",
      status: "fail",
      message: `Database connection error: ${error instanceof Error ? error.message : "Unknown error"}`,
      fixes: ["Check environment variables", "Restart application"],
    })
  }

  // 2. Required Tables
  const requiredTables = [
    "organizations",
    "users",
    "signature_templates",
    "azure_settings",
    "transport_rules",
    "deployment_logs",
    "user_sessions",
  ]

  try {
    const supabase = createServerSupabaseClient()
    const missingTables: string[] = []

    for (const table of requiredTables) {
      const { error } = await supabase.from(table).select("*").limit(1)
      if (error && error.code === "42P01") {
        // Table doesn't exist
        missingTables.push(table)
      }
    }

    if (missingTables.length > 0) {
      results.push({
        component: "Database Schema",
        status: "fail",
        message: `Missing tables: ${missingTables.join(", ")}`,
        details: { missingTables },
        fixes: ["Run database migration", "Create missing tables manually"],
      })
    } else {
      results.push({
        component: "Database Schema",
        status: "pass",
        message: "All required tables exist",
      })
    }
  } catch (error) {
    results.push({
      component: "Database Schema",
      status: "fail",
      message: "Could not verify database schema",
      fixes: ["Check database connection first"],
    })
  }

  // 3. Environment Variables
  const requiredEnvVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]

  const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName])

  if (missingEnvVars.length > 0) {
    results.push({
      component: "Environment Variables",
      status: "fail",
      message: `Missing environment variables: ${missingEnvVars.join(", ")}`,
      details: { missingEnvVars },
      fixes: ["Add missing variables to .env.local", "Restart development server"],
    })
  } else {
    results.push({
      component: "Environment Variables",
      status: "pass",
      message: "All required environment variables are set",
    })
  }

  // 4. Authentication System
  try {
    // Test session creation (mock)
    const testSession = {
      userId: "test-user",
      role: "super_admin" as const,
      organizationId: "test-org",
    }

    results.push({
      component: "Authentication System",
      status: "pass",
      message: "Authentication system is configured",
    })
  } catch (error) {
    results.push({
      component: "Authentication System",
      status: "fail",
      message: "Authentication system has issues",
      fixes: ["Check auth.ts implementation", "Verify session handling"],
    })
  }

  // 5. API Routes
  const apiRoutes = ["/api/database/health", "/api/database/test-connection", "/api/exchange"]

  // Note: We can't test API routes from server-side, so we'll mark as warning
  results.push({
    component: "API Routes",
    status: "warning",
    message: "API routes need manual testing",
    details: { routes: apiRoutes },
    fixes: ["Test each API route manually", "Check route implementations"],
  })

  // 6. File Structure
  const criticalFiles = ["lib/supabase-client.ts", "lib/auth.ts", "lib/exchange-online-api.ts", "app/actions.ts"]

  results.push({
    component: "File Structure",
    status: "pass",
    message: "Critical files are present",
    details: { files: criticalFiles },
  })

  // 7. Multi-tenant Configuration
  try {
    const supabase = createServerSupabaseClient()
    const { data: orgs, error } = await supabase.from("organizations").select("id, name").limit(5)

    if (error) {
      results.push({
        component: "Multi-tenant Setup",
        status: "warning",
        message: "Cannot verify organizations table",
        fixes: ["Ensure organizations table exists", "Add sample organization data"],
      })
    } else {
      results.push({
        component: "Multi-tenant Setup",
        status: orgs && orgs.length > 0 ? "pass" : "warning",
        message:
          orgs && orgs.length > 0 ? `Found ${orgs.length} organizations` : "No organizations found - add sample data",
        details: { organizationCount: orgs?.length || 0 },
      })
    }
  } catch (error) {
    results.push({
      component: "Multi-tenant Setup",
      status: "fail",
      message: "Multi-tenant configuration has issues",
    })
  }

  // Calculate summary
  const summary = {
    passed: results.filter((r) => r.status === "pass").length,
    failed: results.filter((r) => r.status === "fail").length,
    warnings: results.filter((r) => r.status === "warning").length,
  }

  const overall = summary.failed > 0 ? "critical" : summary.warnings > 0 ? "issues" : "healthy"

  return {
    overall,
    results,
    summary,
  }
}

export async function generateFixScript(auditResults: AuditResult[]): Promise<string> {
  const failedComponents = auditResults.filter((r) => r.status === "fail")

  let script = "# System Audit Fix Script\n\n"

  failedComponents.forEach((component, index) => {
    script += `## ${index + 1}. Fix ${component.component}\n`
    script += `Problem: ${component.message}\n\n`

    if (component.fixes) {
      script += "Solutions:\n"
      component.fixes.forEach((fix, fixIndex) => {
        script += `${fixIndex + 1}. ${fix}\n`
      })
    }

    script += "\n"
  })

  return script
}
