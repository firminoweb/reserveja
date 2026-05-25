import { Skeleton } from "@/components/ui/skeleton"

export default function PanelDashboardLoading() {
  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl">
      {/* Title */}
      <Skeleton className="h-8 w-32" />
      <Skeleton className="mt-2 h-4 w-48" />

      {/* KPI cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      {/* Bookings list */}
      <Skeleton className="mt-8 h-5 w-40" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
