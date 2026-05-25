import { Skeleton } from "@/components/ui/skeleton"

export default function HistoricoLoading() {
  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl">
      <Skeleton className="h-8 w-28" />

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Skeleton className="h-10 w-36 rounded-md" />
        <Skeleton className="h-10 w-36 rounded-md" />
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>

      {/* Table rows */}
      <div className="mt-6 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
