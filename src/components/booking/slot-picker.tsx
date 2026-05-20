"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { addDays, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toZonedTime } from "date-fns-tz"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { formatLocal } from "@/lib/time"

type Slot = {
  startsAt: string
  endsAt: string
  professionalId: string
}

type Professional = {
  id: string
  name: string
  photoUrl: string | null
}

type Props = {
  slug: string
  serviceId: string
  timezone: string
  professionals: Professional[]
}

const DAYS_AHEAD = 14

function buildDays(timezone: string) {
  const todayLocal = toZonedTime(new Date(), timezone)
  return Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const d = addDays(todayLocal, i)
    return {
      iso: format(d, "yyyy-MM-dd"),
      weekday: format(d, "EEE", { locale: ptBR }).replace(".", ""),
      day: format(d, "dd"),
      isToday: i === 0,
      isTomorrow: i === 1,
    }
  })
}

export function SlotPicker({ slug, serviceId, timezone, professionals }: Props) {
  const router = useRouter()
  const days = useMemo(() => buildDays(timezone), [timezone])
  const [selectedDate, setSelectedDate] = useState(days[0].iso)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["availability", slug, serviceId, selectedDate],
    queryFn: async () => {
      const url = new URL("/api/availability", window.location.origin)
      url.searchParams.set("establishmentSlug", slug)
      url.searchParams.set("serviceId", serviceId)
      url.searchParams.set("date", selectedDate)
      const res = await fetch(url)
      if (!res.ok) throw new Error("failed")
      return (await res.json()) as { slots: Slot[] }
    },
  })

  const byProfessional = useMemo(() => {
    const map = new Map<string, Slot[]>()
    for (const s of data?.slots ?? []) {
      const arr = map.get(s.professionalId) ?? []
      arr.push(s)
      map.set(s.professionalId, arr)
    }
    return map
  }, [data])

  function pickSlot(slot: Slot) {
    const params = new URLSearchParams({
      serviceId,
      professionalId: slot.professionalId,
      startsAt: slot.startsAt,
    })
    router.push(`/${slug}/agendar/confirmar?${params.toString()}`)
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="-mx-4 sm:-mx-1 flex gap-2 overflow-x-auto px-4 sm:px-1 pb-2 scrollbar-thin snap-x">
        {days.map((d) => {
          const selected = d.iso === selectedDate
          return (
            <button
              key={d.iso}
              type="button"
              onClick={() => setSelectedDate(d.iso)}
              className={cn(
                "shrink-0 snap-start w-16 rounded-xl border py-3 text-center text-sm transition-all",
                selected
                  ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "border-border bg-card hover:border-primary/40 hover:bg-primary/5",
              )}
            >
              <div
                className={cn(
                  "text-[10px] uppercase tracking-wide font-medium",
                  selected ? "opacity-90" : "text-muted-foreground",
                )}
              >
                {d.isToday ? "Hoje" : d.isTomorrow ? "Amanhã" : d.weekday}
              </div>
              <div className="mt-0.5 text-lg font-bold">{d.day}</div>
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">Erro ao carregar horários. Tente outra data.</p>
      ) : professionals.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum profissional disponível para este serviço.
        </p>
      ) : (
        <div className="space-y-4">
          {professionals.map((pro) => {
            const slots = byProfessional.get(pro.id) ?? []
            return (
              <div
                key={pro.id}
                className="rounded-xl border bg-card p-4 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {pro.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pro.photoUrl}
                      alt=""
                      className="size-10 shrink-0 rounded-full object-cover ring-2 ring-primary/15"
                    />
                  ) : (
                    <div className="size-10 shrink-0 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center">
                      {pro.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="font-medium truncate">{pro.name}</div>
                </div>
                {slots.length === 0 ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Sem horários disponíveis neste dia.
                  </p>
                ) : (
                  <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map((s) => (
                      <Button
                        key={s.startsAt}
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-primary/30 hover:bg-primary hover:text-primary-foreground hover:border-primary"
                        onClick={() => pickSlot(s)}
                      >
                        {formatLocal(new Date(s.startsAt), timezone, "HH:mm")}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
