import { Skeleton } from "@/components/ui/skeleton"

export default function EstablishmentLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 md:px-6 py-6 md:py-10">
      {/* Header: logo + name */}
      <div className="flex items-center gap-3 md:gap-4">
        <Skeleton className="size-14 md:size-16 rounded-full" />
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Address block */}
      <Skeleton className="mt-6 h-20 w-full rounded-lg" />

      {/* CTA button */}
      <div className="mt-6 md:mt-8 flex sm:justify-end">
        <Skeleton className="h-11 w-full sm:w-44 rounded-md" />
      </div>

      {/* Services heading */}
      <Skeleton className="mt-8 md:mt-10 h-5 w-24" />

      {/* Service cards */}
      <div className="mt-4 grid gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </main>
  )
}
