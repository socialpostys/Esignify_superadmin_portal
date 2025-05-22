import { DashboardLayout } from "@/components/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export default function AddUserLoading() {
  return (
    <DashboardLayout userRole="super-admin">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-10 w-48" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  )
}
