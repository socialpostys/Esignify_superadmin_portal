import { Skeleton } from "@/components/ui/skeleton"

export default function DomainLoading() {
  return (
    <div className="container mx-auto py-8">
      <Skeleton className="h-10 w-64 mb-6" />

      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-md" />

        <div className="grid gap-6">
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    </div>
  )
}
