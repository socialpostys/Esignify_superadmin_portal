import { DashboardLayout } from "@/components/dashboard-layout"
import { RefreshCw } from "lucide-react"

export default function ExchangeSetupLoading() {
  return (
    <DashboardLayout userRole="org-admin">
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    </DashboardLayout>
  )
}
