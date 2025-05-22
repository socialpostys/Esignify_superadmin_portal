import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function Loading() {
  return (
    <DashboardLayout userRole="org-admin">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/org-admin/signatures">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Export Signatures</h1>
            <p className="text-muted-foreground">Export signature data and deployment scripts</p>
          </div>
        </div>

        <Tabs defaultValue="script" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="script">PowerShell Script</TabsTrigger>
            <TabsTrigger value="data">Raw Data</TabsTrigger>
          </TabsList>

          <TabsContent value="script" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>PowerShell Deployment Script</CardTitle>
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-[400px] w-full" />
                <div className="flex justify-end">
                  <Skeleton className="h-10 w-40" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
