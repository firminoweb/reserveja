"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { addDays, format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toZonedTime } from "date-fns-tz"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

const DAYS_AHEAD = 30
const VISIBLE = 7
const ANY_PROFESSIONAL = "__any__"

type Day = {
  iso: string
  date: Date
  weekday: string
  day: string
  isToday: boolean
  isTomorrow: boolean
}

function buildDays(timezone: string): Day[] {
  const todayLocal = toZonedTime(new Date(), timezone)
  return Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const d = addDays(todayLocal, i)
    return {
      iso: format(d, "yyyy-MM-dd"),
      date: d,
      weekday: format(d, "EEE", { locale: ptBR }).replace(".", ""),
      day: format(d, "dd"),
      isToday: i === 0,
      isTomorrow: i === 1,
    }
  })
}

function rangeLabel(days: Day[], start: number) {
  const first = days[start]
  const last = days[Math.min(start + VISIBLE - 1, days.length - 1)]
  if (!first || !last) return ""
  const sameMonth = format(first.date, "MMM", { locale: ptBR }) === format(last.date, "MMM", { locale: ptBR })
  const firstLabel = format(first.date, sameMonth ? "dd" : "dd MMM", { locale: ptBR })
  const lastLabel = format(last.date, "dd MMM", { locale: ptBR })
  return `${firstLabel} – ${lastLabel}`.replace(/\./g, "")
}

export function SlotPicker({ slug, serviceId, timezone, professionals }: Props) {
  const router = useRouter()
  const days = useMemo(() => buildDays(timezone), [timezone])
  const [selectedDate, setSelectedDate] = useState(days[0].iso)
  const [weekStart, setWeekStart] = useState(0)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [hasManualSelection, setHasManualSelection] = useState(false)

  const hasMultiple = professionals.length > 1
  const [selectedProId, setSelectedProId] = useState<string>(
    hasMultiple ? ANY_PROFESSIONAL : professionals[0]?.id ?? ANY_PROFESSIONAL,
  )

  const visibleDays = days.slice(weekStart, weekStart + VISIBLE)
  const canPrev = weekStart > 0
  const canNext = weekStart + VISIBLE < days.length
  const minDate = days[0].date
  const maxDate = days[days.length - 1].date

  function pickDate(iso: string) {
    setSelectedDate(iso)
    setHasManualSelection(true)
    const idx = days.findIndex((d) => d.iso === iso)
    if (idx === -1) return
    if (idx < weekStart || idx >= weekStart + VISIBLE) {
      const clamped = Math.max(0, Math.min(idx, days.length - VISIBLE))
      setWeekStart(clamped)
    }
  }

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

  useEffect(() => {
    if (hasManualSelection || !data || data.slots.length > 0) return
    const idx = days.findIndex((d) => d.iso === selectedDate)
    if (idx === -1 || idx >= days.length - 1) return
    const nextIdx = idx + 1
    const t = setTimeout(() => {
      setSelectedDate(days[nextIdx].iso)
      if (nextIdx >= weekStart + VISIBLE) {
        setWeekStart(Math.min(days.length - VISIBLE, nextIdx))
      }
    }, 0)
    return () => clearTimeout(t)
  }, [data, hasManualSelection, days, selectedDate, weekStart])

  const professionalById = useMemo(() => {
    const m = new Map<string, Professional>()
    for (const p of professionals) m.set(p.id, p)
    return m
  }, [professionals])

  const filteredSlots = useMemo(() => {
    const all = data?.slots ?? []
    const filtered =
      selectedProId === ANY_PROFESSIONAL
        ? all
        : all.filter((s) => s.professionalId === selectedProId)
    // Sort by start, dedupe identical times keeping the first occurrence (qualquer
    // profissional pode ter slots iguais; mantém o primeiro).
    return [...filtered].sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  }, [data, selectedProId])

  const headerPro =
    selectedProId === ANY_PROFESSIONAL
      ? null
      : professionalById.get(selectedProId) ?? null

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
      <div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => setWeekStart((v) => Math.max(0, v - VISIBLE))}
            disabled={!canPrev}
            aria-label="Semana anterior"
            className="shrink-0"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="flex-1 justify-center gap-2 font-medium"
              >
                <CalendarIcon className="size-4" />
                <span className="truncate">{rangeLabel(days, weekStart)}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                locale={ptBR}
                selected={parseISO(selectedDate)}
                onSelect={(d) => {
                  if (!d) return
                  pickDate(format(d, "yyyy-MM-dd"))
                  setCalendarOpen(false)
                }}
                disabled={{ before: minDate, after: maxDate }}
                defaultMonth={parseISO(selectedDate)}
              />
            </PopoverContent>
          </Popover>

          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() =>
              setWeekStart((v) => Math.min(days.length - VISIBLE, v + VISIBLE))
            }
            disabled={!canNext}
            aria-label="Próxima semana"
            className="shrink-0"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1.5">
          {visibleDays.map((d) => {
            const selected = d.iso === selectedDate
            return (
              <button
                key={d.iso}
                type="button"
                onClick={() => pickDate(d.iso)}
                className={cn(
                  "min-w-0 rounded-xl border py-2.5 text-center transition-all",
                  selected
                    ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "border-border bg-card hover:border-primary/40 hover:bg-primary/5",
                )}
              >
                <div
                  className={cn(
                    "text-[10px] uppercase tracking-wide font-medium truncate px-0.5",
                    selected ? "opacity-90" : "text-muted-foreground",
                  )}
                >
                  {d.isToday ? "Hoje" : d.isTomorrow ? "Amanhã" : d.weekday}
                </div>
                <div className="mt-0.5 text-base sm:text-lg font-bold">
                  {d.day}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {hasMultiple ? (
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Profissional
          </label>
          <Select value={selectedProId} onValueChange={setSelectedProId}>
            <SelectTrigger className="mt-1.5 w-full">
              <SelectValue placeholder="Escolha um profissional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY_PROFESSIONAL}>Sem preferência</SelectItem>
              {professionals.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">Erro ao carregar horários. Tente outra data.</p>
      ) : professionals.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum profissional disponível para este serviço.
        </p>
      ) : (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          {headerPro ? (
            <div className="flex items-center gap-3 min-w-0">
              {headerPro.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={headerPro.photoUrl}
                  alt=""
                  className="size-10 shrink-0 rounded-full object-cover ring-2 ring-primary/15"
                />
              ) : (
                <div className="size-10 shrink-0 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center">
                  {headerPro.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="font-medium truncate">{headerPro.name}</div>
            </div>
          ) : (
            <div className="text-sm font-medium text-muted-foreground">
              Horários disponíveis
            </div>
          )}

          {filteredSlots.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Sem horários disponíveis neste dia.
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
              {filteredSlots.map((s) => {
                const pro = professionalById.get(s.professionalId)
                const showProLabel = headerPro === null && hasMultiple
                return (
                  <Button
                    key={`${s.startsAt}-${s.professionalId}`}
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-auto flex-col gap-0.5 py-2 border-primary/30",
                      "hover:bg-primary hover:text-primary-foreground hover:border-primary",
                    )}
                    onClick={() => pickSlot(s)}
                  >
                    <span className="font-semibold">
                      {formatLocal(new Date(s.startsAt), timezone, "HH:mm")}
                    </span>
                    {showProLabel && pro ? (
                      <span className="text-[10px] leading-tight opacity-70 truncate max-w-full">
                        {pro.name.split(" ")[0]}
                      </span>
                    ) : null}
                  </Button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
