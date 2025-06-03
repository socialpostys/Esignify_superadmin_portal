"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Settings,
  Database,
  Shield,
  Globe,
  FileText,
} from "lucide-react"

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
  timestamp?: string
}

export default function SystemAuditPage() {
  const [audit, setAudit] = useState<SystemAudit | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fixScript, setFixScript] = useState<string | null>(null)
  const [isGeneratingFix, setIsGeneratingFix] = useState(false)

  const runAudit = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/system/audit")
      const data = await response.json()
      setAudit(data)
    } catch (error) {
      console.error("Error running audit:", error)
      setAudit({
        overall: "critical",
        results: [
          {
            component: "System Access",
            status: "fail",
            message: "Failed to run system audit",
          },
        ],
        summary: { passed: 0, failed: 1, warnings: 0 },
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateFixScript = async () => {
    setIsGeneratingFix(true)
    try {
      const response = await fetch("/api/system/audit", { method: "POST" })
      const data = await response.json()
      setFixScript(data.fixScript)
    } catch (error) {
      console.error("Error generating fix script:", error)
    } finally {
      setIsGeneratingFix(false)
    }
  }

  const downloadFixScript = () => {
    if (!fixScript) return

    const blob = new Blob([fixScript], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `system-audit-fixes-${new Date().toISOString().split("T")[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "fail":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />
    }
  }

  const getComponentIcon = (component: string) => {
    if (component.includes("Database")) return <Database className="h-4 w-4" />
    if (component.includes("Auth")) return <Shield className="h-4 w-4" />
    if (component.includes("API")) return <Globe className="h-4 w-4" />
    if (component.includes("File")) return <FileText className="h-4 w-4" />
    return <Settings className="h-4 w-4" />
  }

  useEffect(() => {
    runAudit()
  }, [])

  return (
    <DashboardLayout userRole="super-admin" orgName="System">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Audit</h1>
            <p className="text-muted-foreground">Comprehensive system health and functionality check</p>
          </div>
          <Button onClick={runAudit} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Run Audit
          </Button>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400 mr-2" />
              <p>Running comprehensive system audit...</p>
            </CardContent>
          </Card>
        ) : audit ? (
          <>
            {/* Overall Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {audit.overall === "healthy" && <CheckCircle className="h-6 w-6 text-green-600" />}
                  {audit.overall === "issues" && <AlertTriangle className="h-6 w-6 text-yellow-600" />}
                  {audit.overall === "critical" && <XCircle className="h-6 w-6 text-red-600" />}
                  System Status: {audit.overall.charAt(0).toUpperCase() + audit.overall.slice(1)}
                </CardTitle>
                <CardDescription>
                  {audit.timestamp && `Last audit: ${new Date(audit.timestamp).toLocaleString()}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{audit.summary.passed}</div>
                    <div className="text-sm text-muted-foreground">Passed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{audit.summary.warnings}</div>
                    <div className="text-sm text-muted-foreground">Warnings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{audit.summary.failed}</div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Critical Issues Alert */}
            {audit.summary.failed > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Critical Issues Found</AlertTitle>
                <AlertDescription>
                  {audit.summary.failed} critical issue(s) need immediate attention. The system may not function
                  properly until these are resolved.
                  <div className="mt-2">
                    <Button variant="outline" size="sm" onClick={generateFixScript} disabled={isGeneratingFix}>
                      {isGeneratingFix ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate Fix Script"}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Detailed Results</TabsTrigger>
                {fixScript && <TabsTrigger value="fixes">Fix Script</TabsTrigger>}
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4">
                  {audit.results.map((result, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getComponentIcon(result.component)}
                            <div>
                              <h3 className="font-medium">{result.component}</h3>
                              <p className="text-sm text-muted-foreground">{result.message}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(result.status)}
                            <Badge
                              variant={
                                result.status === "pass"
                                  ? "default"
                                  : result.status === "warning"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {result.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                {audit.results.map((result, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        {result.component}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p>{result.message}</p>

                      {result.details && (
                        <div>
                          <h4 className="font-medium mb-2">Details:</h4>
                          <pre className="bg-slate-100 p-3 rounded text-sm overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </div>
                      )}

                      {result.fixes && result.fixes.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Recommended Fixes:</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {result.fixes.map((fix, fixIndex) => (
                              <li key={fixIndex} className="text-sm">
                                {fix}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {fixScript && (
                <TabsContent value="fixes" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Fix Script
                        <Button variant="outline" size="sm" onClick={downloadFixScript}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </CardTitle>
                      <CardDescription>Step-by-step instructions to resolve critical issues</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-slate-100 p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap">
                        {fixScript}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  )
}
