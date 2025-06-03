"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Rocket,
  Download,
  Target,
  Shield,
  Users,
  FileText,
} from "lucide-react"
import { assessLaunchReadiness, generateLaunchPlan } from "@/lib/launch-readiness"

export default function LaunchReadinessPage() {
  const [readiness, setReadiness] = useState<any>(null)
  const [launchPlan, setLaunchPlan] = useState<string>("")

  useEffect(() => {
    const assessment = assessLaunchReadiness()
    setReadiness(assessment)
    setLaunchPlan(generateLaunchPlan(assessment))
  }, [])

  const downloadPlan = () => {
    const blob = new Blob([launchPlan], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `launch-readiness-plan-${new Date().toISOString().split("T")[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "needs_work":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case "critical":
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Security":
        return <Shield className="h-5 w-5" />
      case "User Experience":
        return <Users className="h-5 w-5" />
      case "Documentation":
        return <FileText className="h-5 w-5" />
      default:
        return <Target className="h-5 w-5" />
    }
  }

  if (!readiness) {
    return (
      <DashboardLayout userRole="super-admin" orgName="System">
        <div className="flex items-center justify-center h-64">
          <div>Loading launch readiness assessment...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="super-admin" orgName="System">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Launch Readiness</h1>
            <p className="text-muted-foreground">Comprehensive assessment for production deployment</p>
          </div>
          <Button onClick={downloadPlan}>
            <Download className="mr-2 h-4 w-4" />
            Download Plan
          </Button>
        </div>

        {/* Overall Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-6 w-6" />
              Launch Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">
                    {readiness.readyForLaunch ? "Ready for MVP Launch! 🚀" : "Not Ready for Launch"}
                  </h3>
                  <p className="text-muted-foreground">
                    Overall Status: {readiness.overallStatus.replace("_", " ").toUpperCase()}
                  </p>
                </div>
                <div className="text-right">
                  {readiness.readyForLaunch ? (
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  ) : (
                    <XCircle className="h-12 w-12 text-red-600" />
                  )}
                </div>
              </div>

              {readiness.readyForLaunch ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>MVP Launch Possible</AlertTitle>
                  <AlertDescription>
                    You can launch with current functionality! Address critical issues first, then launch with limited
                    beta users and iterate based on feedback.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Critical Issues Must Be Resolved</AlertTitle>
                  <AlertDescription>
                    {readiness.criticalIssues.length} critical issue(s) must be fixed before launch. Focus on security
                    and core functionality first.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Critical Issues */}
        {readiness.criticalIssues.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                Critical Issues ({readiness.criticalIssues.length})
              </CardTitle>
              <CardDescription>These must be fixed before launch</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {readiness.criticalIssues.map((issue: any, index: number) => (
                  <div key={index} className="border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{issue.item}</h4>
                        <p className="text-sm text-muted-foreground">{issue.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{issue.category}</Badge>
                          <Badge variant="destructive">{issue.priority} priority</Badge>
                          {issue.estimatedHours && <Badge variant="secondary">{issue.estimatedHours}h estimated</Badge>}
                        </div>
                      </div>
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="categories">By Category</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="plan">Launch Plan</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {Object.values(readiness.categories).reduce((sum: number, cat: any) => sum + cat.ready, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Ready</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-8 w-8 text-yellow-600" />
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">{readiness.recommendations.length}</div>
                      <div className="text-sm text-muted-foreground">Needs Work</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-8 w-8 text-red-600" />
                    <div>
                      <div className="text-2xl font-bold text-red-600">{readiness.criticalIssues.length}</div>
                      <div className="text-sm text-muted-foreground">Critical</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="grid gap-4">
              {Object.entries(readiness.categories).map(([category, stats]: [string, any]) => (
                <Card key={category}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(category)}
                        <h3 className="font-medium">{category}</h3>
                      </div>
                      <Badge
                        variant={
                          stats.percentage >= 80 ? "default" : stats.percentage >= 60 ? "secondary" : "destructive"
                        }
                      >
                        {stats.percentage}%
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Progress value={stats.percentage} className="h-2" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>
                          {stats.ready} of {stats.total} ready
                        </span>
                        <span>{stats.total - stats.ready} remaining</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            {readiness.recommendations.length > 0 ? (
              <div className="space-y-3">
                {readiness.recommendations.map((rec: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{rec.item}</h4>
                          <p className="text-sm text-muted-foreground">{rec.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{rec.category}</Badge>
                            <Badge variant={rec.priority === "high" ? "destructive" : "secondary"}>
                              {rec.priority} priority
                            </Badge>
                            {rec.estimatedHours && <Badge variant="secondary">{rec.estimatedHours}h estimated</Badge>}
                          </div>
                        </div>
                        {getStatusIcon(rec.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-medium">All recommendations addressed!</h3>
                  <p className="text-muted-foreground">Your system is in excellent shape for launch.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="plan" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Launch Plan</CardTitle>
                <CardDescription>Step-by-step plan for production deployment</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm bg-slate-50 p-4 rounded-lg overflow-x-auto">
                  {launchPlan}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
