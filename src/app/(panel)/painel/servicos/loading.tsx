import { Skeleton } from "@/components/ui/skeleton"

export default function ServicosLoading() {
  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl">
      {/* Header: title + button */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>

      {/* Service cards */}
      <div className="mt-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border p-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-5 w-16" />
            <Skeleton className="size-9 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
