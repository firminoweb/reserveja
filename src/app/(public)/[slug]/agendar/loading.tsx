import { Skeleton } from "@/components/ui/skeleton"

export default function AgendarLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 md:px-6 py-6 md:py-10">
      {/* Stepper */}
      <Skeleton className="h-8 w-full max-w-md mx-auto rounded-md" />

      {/* Title */}
      <Skeleton className="mt-8 h-6 w-48" />

      {/* Service cards */}
      <div className="mt-4 grid gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </main>
  )
}
