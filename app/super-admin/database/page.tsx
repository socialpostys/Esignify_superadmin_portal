"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Database, CheckCircle, XCircle, AlertTriangle, RefreshCw, Settings } from "lucide-react"

interface ConnectionTest {
  success: boolean
  error?: string
  message?: string
  envCheck?: {
    NEXT_PUBLIC_SUPABASE_URL: boolean
    NEXT_PUBLIC_SUPABASE_ANON_KEY: boolean
    SUPABASE_SERVICE_ROLE_KEY: boolean
    supabaseUrl?: string
  }
  tablesFound?: number
  supabaseError?: any
}

interface TableInfo {
  name: string
  exists: boolean
  columns?: string[]
  error?: string
}

interface DatabaseHealth {
  connected: boolean
  tablesStatus: TableInfo[]
  missingTables: string[]
  errors: string[]
  timestamp?: string
}

export default function DatabaseHealthPage() {
  const [connectionTest, setConnectionTest] = useState<ConnectionTest | null>(null)
  const [health, setHealth] = useState<DatabaseHealth | null>(null)
  const [isTestingConnection, setIsTestingConnection] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const testConnection = async () => {
    setIsTestingConnection(true)
    try {
      const response = await fetch("/api/database/test-connection")
      const data = await response.json()
      setConnectionTest(data)
    } catch (error) {
      console.error("Error testing connection:", error)
      setConnectionTest({
        success: false,
        error: "Failed to test database connection",
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const checkHealth = async () => {
    if (!connectionTest?.success) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/database/health")
      const data = await response.json()
      setHealth(data)
    } catch (error) {
      console.error("Error checking database health:", error)
      setHealth({
        connected: false,
        tablesStatus: [],
        missingTables: [],
        errors: ["Failed to check database health"],
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createTables = async () => {
    setIsCreating(true)
    try {
      // Use direct SQL execution since our API might not work
      const response = await fetch("/api/database/create-tables", {
        method: "POST",
      })
      const result = await response.json()

      if (result.success) {
        await testConnection()
        await checkHealth()
      }
    } catch (error) {
      console.error("Error creating tables:", error)
    } finally {
      setIsCreating(false)
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  useEffect(() => {
    if (connectionTest?.success) {
      checkHealth()
    }
  }, [connectionTest])

  return (
    <DashboardLayout userRole="super-admin" orgName="System">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Database Health</h1>
            <p className="text-muted-foreground">Monitor and manage database status</p>
          </div>
          <Button onClick={testConnection} disabled={isTestingConnection}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isTestingConnection ? "animate-spin" : ""}`} />
            Test Connection
          </Button>
        </div>

        {/* Connection Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Connection Test
            </CardTitle>
            <CardDescription>Basic connectivity and environment check</CardDescription>
          </CardHeader>
          <CardContent>
            {isTestingConnection ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Testing connection...</span>
              </div>
            ) : connectionTest ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {connectionTest.success ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-green-600 font-medium">Connection Successful</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="text-red-600 font-medium">Connection Failed</span>
                    </>
                  )}
                </div>

                {connectionTest.error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Connection Error</AlertTitle>
                    <AlertDescription>{connectionTest.error}</AlertDescription>
                  </Alert>
                )}

                {connectionTest.envCheck && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Environment Variables:</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {Object.entries(connectionTest.envCheck).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <code className="text-sm">{key}</code>
                          <Badge variant={value ? "default" : "destructive"}>
                            {typeof value === "boolean" ? (value ? "Set" : "Missing") : value}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {connectionTest.success && (
                  <div className="text-sm text-muted-foreground">Found {connectionTest.tablesFound} system tables</div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Environment Setup Instructions */}
        {connectionTest && !connectionTest.success && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Setup Required</AlertTitle>
            <AlertDescription>
              <div className="space-y-2">
                <p>
                  Please ensure you have the following environment variables set in your <code>.env.local</code> file:
                </p>
                <pre className="bg-slate-100 p-3 rounded text-sm overflow-x-auto">
                  {`NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key`}
                </pre>
                <p className="text-sm">Get these values from your Supabase project dashboard → Settings → API</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Create Tables Button */}
        {connectionTest?.success && (
          <Card>
            <CardHeader>
              <CardTitle>Database Setup</CardTitle>
              <CardDescription>Create the required database tables</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={createTables} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Tables...
                  </>
                ) : (
                  "Create Database Tables"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Health Check Results */}
        {connectionTest?.success && health && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Health
              </CardTitle>
              <CardDescription>
                {health.timestamp && `Last checked: ${new Date(health.timestamp).toLocaleString()}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {health.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Errors</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-5">
                        {health.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 gap-2">
                  {health.tablesStatus.map((table, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-2">
                        {table.exists ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span>{table.name}</span>
                      </div>
                      <Badge variant={table.exists ? "default" : "destructive"}>
                        {table.exists ? "Exists" : "Missing"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
