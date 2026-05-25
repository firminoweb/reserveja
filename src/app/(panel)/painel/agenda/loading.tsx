import { Skeleton } from "@/components/ui/skeleton"

export default function AgendaLoading() {
  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl">
      {/* Header: title + date nav */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-28" />
        <div className="flex items-center gap-2">
          <Skeleton className="size-9 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md" />
          <Skeleton className="size-9 rounded-md" />
        </div>
      </div>

      {/* Week day headers */}
      <div className="mt-6 grid grid-cols-6 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-md" />
        ))}
      </div>

      {/* Time grid */}
      <div className="mt-4 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="grid grid-cols-6 gap-2">
            {Array.from({ length: 6 }).map((_, j) => (
              <Skeleton key={j} className="h-14 rounded-md" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
