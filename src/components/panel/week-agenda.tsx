"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { fromZonedTime } from "date-fns-tz"
import { Check, ChevronLeft, ChevronRight, Lock, UserX, XCircle } from "lucide-react"
import type { BookingStatus } from "@prisma/client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  hueFromId,
  minutesToHHMM,
  type DayBlockSegment,
} from "@/lib/agenda-week"
import {
  rescheduleBookingAction,
  setBookingStatusAction,
} from "@/app/(panel)/painel/_actions"

const HOUR_HEIGHT = 64 // px
const PROFESSIONAL_ALL = "all"
const DRAG_THRESHOLD_PX = 5
const SNAP_MIN = 15

type DragSnapshot = {
  bookingId: string
  durationMin: number
  initialDayIndex: number
  initialLocalStartMin: number
  startX: number
  startY: number
  targetDayIndex: number
  targetLocalStartMin: number
  promoted: boolean
}

const WEEKDAY_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  NO_SHOW: "Não compareceu",
}

export type AgendaBooking = {
  id: string
  /** Minutos desde meia-noite local do dia (calculado no server, no fuso do estab). */
  localStartMin: number
  localEndMin: number
  startLabel: string
  endLabel: string
  clientName: string
  clientPhone: string
  serviceName: string
  professionalId: string
  professionalName: string
  status: BookingStatus
  notes: string | null
  lane: number
}

export type AgendaDay = {
  dateIso: string
  dayLabel: string // "12/05"
  weekdayLabel: string // "Seg"
  isToday: boolean
  totalLanes: number
  bookings: AgendaBooking[]
  blocks: DayBlockSegment[]
}

type Professional = { id: string; name: string }

type Props = {
  /** ISO date (YYYY-MM-DD) da segunda da semana atual. */
  weekStartIso: string
  /** ISO date (YYYY-MM-DD) da segunda da semana anterior, próxima, hoje. */
  prevAnchor: string
  nextAnchor: string
  todayAnchor: string
  rangeLabel: string
  days: AgendaDay[]
  startHour: number
  endHour: number
  professionals: Professional[]
  selectedProfessionalId: string | null
  establishmentTimezone: string
}

export function WeekAgenda({
  weekStartIso,
  prevAnchor,
  nextAnchor,
  todayAnchor,
  rangeLabel,
  days,
  startHour,
  endHour,
  professionals,
  selectedProfessionalId,
  establishmentTimezone,
}: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<AgendaBooking | null>(null)
  const [pending, startTransition] = useTransition()
  const [drag, setDrag] = useState<DragSnapshot | null>(null)
  const [rescheduling, setRescheduling] = useState(false)
  const dragRef = useRef<DragSnapshot | null>(null)

  const todayIdx = useMemo(() => {
    const idx = days.findIndex((d) => d.isToday)
    return idx >= 0 ? idx : 0
  }, [days])
  const [mobileDayIdx, setMobileDayIdx] = useState<number>(todayIdx)

  const totalMinutes = (endHour - startHour) * 60
  const totalHeight = (endHour - startHour) * HOUR_HEIGHT

  const hours = useMemo(
    () => Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i),
    [startHour, endHour],
  )

  function buildHref(overrides: { anchor?: string; professionalId?: string | null }) {
    const params = new URLSearchParams()
    params.set("anchor", overrides.anchor ?? weekStartIso)
    const proId =
      overrides.professionalId === undefined
        ? selectedProfessionalId
        : overrides.professionalId
    if (proId) params.set("professionalId", proId)
    return `/painel/agenda?${params.toString()}`
  }

  function goToWeek(anchor: string) {
    router.push(buildHref({ anchor }))
  }

  function changeProfessional(value: string) {
    router.push(
      buildHref({
        professionalId: value === PROFESSIONAL_ALL ? null : value,
      }),
    )
  }

  function changeStatus(next: BookingStatus, label: string) {
    if (!selected) return
    startTransition(async () => {
      const res = await setBookingStatusAction(selected.id, next)
      if (res.ok) {
        toast.success(`Marcado como ${label}`)
        setSelected(null)
        router.refresh()
      } else {
        toast.error(res.message)
      }
    })
  }

  function isReschedulable(b: AgendaBooking) {
    return b.status === "PENDING" || b.status === "CONFIRMED"
  }

  /**
   * Dado um pointer event, descobre em qual coluna de dia o cursor está e
   * que minuto local (snapped) corresponde à posição vertical.
   */
  function pointerToTarget(
    e: React.PointerEvent,
    durationMin: number,
  ): { dayIndex: number; localStartMin: number } | null {
    const el = document.elementFromPoint(e.clientX, e.clientY)
    const col = el?.closest<HTMLElement>("[data-day-column]")
    if (!col) return null
    const dayIndex = Number(col.dataset.dayColumn)
    if (Number.isNaN(dayIndex)) return null

    const rect = col.getBoundingClientRect()
    const yInCol = e.clientY - rect.top
    const visibleMin = (endHour - startHour) * 60
    const rawMin = (yInCol / rect.height) * visibleMin + startHour * 60
    const snapped = Math.round(rawMin / SNAP_MIN) * SNAP_MIN
    const maxStart = endHour * 60 - durationMin
    const clamped = Math.max(startHour * 60, Math.min(maxStart, snapped))
    return { dayIndex, localStartMin: clamped }
  }

  function handleBookingPointerDown(
    e: React.PointerEvent<HTMLButtonElement>,
    b: AgendaBooking,
    dayIdx: number,
  ) {
    if (e.button !== 0 || e.pointerType === "touch") return
    if (rescheduling) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const snap: DragSnapshot = {
      bookingId: b.id,
      durationMin: b.localEndMin - b.localStartMin,
      initialDayIndex: dayIdx,
      initialLocalStartMin: b.localStartMin,
      startX: e.clientX,
      startY: e.clientY,
      targetDayIndex: dayIdx,
      targetLocalStartMin: b.localStartMin,
      promoted: false,
    }
    dragRef.current = snap
  }

  function handleBookingPointerMove(
    e: React.PointerEvent<HTMLButtonElement>,
    b: AgendaBooking,
  ) {
    const snap = dragRef.current
    if (!snap || snap.bookingId !== b.id) return

    if (!snap.promoted) {
      if (!isReschedulable(b)) return
      const dist = Math.hypot(e.clientX - snap.startX, e.clientY - snap.startY)
      if (dist < DRAG_THRESHOLD_PX) return
      snap.promoted = true
      setDrag({ ...snap })
    }

    const target = pointerToTarget(e, snap.durationMin)
    if (!target) return
    if (
      target.dayIndex === snap.targetDayIndex &&
      target.localStartMin === snap.targetLocalStartMin
    )
      return
    snap.targetDayIndex = target.dayIndex
    snap.targetLocalStartMin = target.localStartMin
    setDrag({ ...snap })
  }

  function handleBookingPointerUp(
    e: React.PointerEvent<HTMLButtonElement>,
    b: AgendaBooking,
  ) {
    const snap = dragRef.current
    if (!snap || snap.bookingId !== b.id) return
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    const wasDrag = snap.promoted
    dragRef.current = null

    if (!wasDrag) {
      setDrag(null)
      setSelected(b)
      return
    }

    const moved =
      snap.targetDayIndex !== snap.initialDayIndex ||
      snap.targetLocalStartMin !== snap.initialLocalStartMin

    if (!moved) {
      setDrag(null)
      return
    }

    const targetDay = days[snap.targetDayIndex]
    if (!targetDay) {
      setDrag(null)
      return
    }

    const localIso = `${targetDay.dateIso}T${minutesToHHMM(snap.targetLocalStartMin)}:00`
    const utcDate = fromZonedTime(localIso, establishmentTimezone)

    setDrag(null)
    setRescheduling(true)
    startTransition(async () => {
      const res = await rescheduleBookingAction(b.id, utcDate.toISOString())
      setRescheduling(false)
      if (res.ok) {
        toast.success("Agendamento remarcado")
        router.refresh()
      } else {
        toast.error(res.message)
      }
    })
  }

  function handleBookingPointerCancel(
    e: React.PointerEvent<HTMLButtonElement>,
    b: AgendaBooking,
  ) {
    if (dragRef.current?.bookingId !== b.id) return
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    dragRef.current = null
    setDrag(null)
  }

  const totalBookings = days.reduce((acc, d) => acc + d.bookings.length, 0)
  const canActOnSelected =
    selected && selected.status !== "COMPLETED" && selected.status !== "CANCELLED"
  const showProfessionalFilter = professionals.length >= 2
  const mobileDay = days[mobileDayIdx] ?? days[0]
  const mobileTimeline = useMemo(() => {
    if (!mobileDay) return []
    const items: Array<
      | { kind: "booking"; min: number; data: AgendaBooking }
      | { kind: "block"; min: number; data: DayBlockSegment }
    > = [
      ...mobileDay.bookings.map((b) => ({
        kind: "booking" as const,
        min: b.localStartMin,
        data: b,
      })),
      ...mobileDay.blocks.map((b) => ({
        kind: "block" as const,
        min: b.localStartMin,
        data: b,
      })),
    ]
    items.sort((a, b) => a.min - b.min)
    return items
  }, [mobileDay])

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-sm text-muted-foreground">
            {rangeLabel} · {totalBookings} agendamento(s)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {showProfessionalFilter ? (
            <Select
              value={selectedProfessionalId ?? PROFESSIONAL_ALL}
              onValueChange={changeProfessional}
            >
              <SelectTrigger size="sm" className="min-w-[160px]">
                <SelectValue placeholder="Todos os profissionais" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PROFESSIONAL_ALL}>
                  Todos os profissionais
                </SelectItem>
                {professionals.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Semana anterior"
              onClick={() => goToWeek(prevAnchor)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToWeek(todayAnchor)}
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Próxima semana"
              onClick={() => goToWeek(nextAnchor)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop: grade semanal */}
      <div className="mt-6 hidden md:block overflow-x-auto border rounded-lg bg-card">
        <div className="grid grid-cols-[60px_repeat(7,minmax(120px,1fr))] min-w-[840px]">
          {/* Header */}
          <div className="border-b border-r bg-muted/30" />
          {days.map((d, i) => (
            <div
              key={d.dateIso}
              className={`border-b ${i < 6 ? "border-r" : ""} px-2 py-3 text-center bg-muted/30`}
            >
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                {WEEKDAY_SHORT[i]}
              </div>
              <div
                className={`text-base font-semibold ${d.isToday ? "text-primary" : ""}`}
              >
                {d.dayLabel}
              </div>
              {d.bookings.length > 0 ? (
                <Badge variant="secondary" className="mt-1 text-xs">
                  {d.bookings.length}
                </Badge>
              ) : null}
            </div>
          ))}

          {/* Body */}
          <div className="border-r" style={{ height: totalHeight }}>
            {hours.map((h, i) => (
              <div
                key={h}
                className="text-xs text-muted-foreground text-right pr-2"
                style={{
                  height: i === hours.length - 1 ? 0 : HOUR_HEIGHT,
                  marginTop: i === 0 ? -8 : 0,
                }}
              >
                {i === hours.length - 1 ? null : `${h.toString().padStart(2, "0")}:00`}
              </div>
            ))}
          </div>

          {days.map((d, dayIdx) => (
            <div
              key={d.dateIso}
              data-day-column={dayIdx}
              className={`relative ${dayIdx < 6 ? "border-r" : ""}`}
              style={{ height: totalHeight }}
            >
              {/* Linhas de hora */}
              {hours.slice(0, -1).map((h) => (
                <div
                  key={h}
                  className="border-b border-dashed border-border/60"
                  style={{ height: HOUR_HEIGHT }}
                />
              ))}

              {/* Bloqueios (atrás dos bookings) */}
              {d.blocks.map((b) => {
                const visibleStart = startHour * 60
                const visibleEnd = endHour * 60
                const clippedStart = Math.max(b.localStartMin, visibleStart)
                const clippedEnd = Math.min(b.localEndMin, visibleEnd)
                if (clippedEnd <= clippedStart) return null
                const topPct = ((clippedStart - visibleStart) / totalMinutes) * 100
                const heightPct = ((clippedEnd - clippedStart) / totalMinutes) * 100
                const tooltip = [
                  b.reason ?? "Bloqueio",
                  b.professionalName ?? "Todo o salão",
                ].join(" · ")

                return (
                  <div
                    key={`${b.id}-${b.localStartMin}`}
                    title={tooltip}
                    aria-label={tooltip}
                    className="absolute pointer-events-none rounded-sm overflow-hidden"
                    style={{
                      top: `${topPct}%`,
                      height: `${heightPct}%`,
                      left: 2,
                      right: 2,
                      zIndex: 0,
                      background:
                        "repeating-linear-gradient(-45deg, hsl(220 9% 88%) 0 4px, hsl(220 9% 94%) 4px 10px)",
                      border: "1px dashed hsl(220 9% 65%)",
                    }}
                  >
                    <div className="absolute inset-1 flex items-start gap-1 text-[10px] leading-tight text-muted-foreground">
                      <Lock className="size-3 shrink-0 mt-px" aria-hidden />
                      <span className="line-clamp-2">
                        {b.reason ?? "Bloqueio"}
                        {b.professionalName ? ` · ${b.professionalName}` : ""}
                      </span>
                    </div>
                  </div>
                )
              })}

              {/* Bookings */}
              {d.bookings.map((b) => {
                const minutesFromTop = Math.max(0, b.localStartMin - startHour * 60)
                const heightPct = ((b.localEndMin - b.localStartMin) / totalMinutes) * 100
                const topPct = (minutesFromTop / totalMinutes) * 100
                const widthPct = 100 / d.totalLanes
                const leftPct = b.lane * widthPct
                const hue = hueFromId(b.professionalId)
                const isFinal = b.status === "CANCELLED" || b.status === "COMPLETED"
                const isDragging = drag?.bookingId === b.id
                const canDrag = isReschedulable(b)

                return (
                  <button
                    key={b.id}
                    type="button"
                    onPointerDown={(e) => handleBookingPointerDown(e, b, dayIdx)}
                    onPointerMove={(e) => handleBookingPointerMove(e, b)}
                    onPointerUp={(e) => handleBookingPointerUp(e, b)}
                    onPointerCancel={(e) => handleBookingPointerCancel(e, b)}
                    title={canDrag ? "Arraste para remarcar" : undefined}
                    className={`absolute rounded-md p-1.5 text-left text-xs overflow-hidden transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 disabled:opacity-50 ${
                      canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                    } touch-none select-none`}
                    style={{
                      top: `${topPct}%`,
                      height: `${heightPct}%`,
                      left: `calc(${leftPct}% + 2px)`,
                      width: `calc(${widthPct}% - 4px)`,
                      zIndex: 1,
                      backgroundColor: `hsl(${hue} 70% 92%)`,
                      borderLeft: `3px solid hsl(${hue} 60% 50%)`,
                      color: `hsl(${hue} 60% 25%)`,
                      opacity: isDragging ? 0.35 : isFinal ? 0.6 : 1,
                      textDecoration: b.status === "CANCELLED" ? "line-through" : undefined,
                      pointerEvents: isDragging ? "none" : undefined,
                    }}
                  >
                    <div className="font-semibold leading-tight truncate">
                      {b.startLabel} {b.clientName}
                    </div>
                    <div className="truncate opacity-80 leading-tight">
                      {b.serviceName}
                    </div>
                  </button>
                )
              })}

              {/* Ghost de drag pra esta coluna */}
              {drag && drag.promoted && drag.targetDayIndex === dayIdx
                ? (() => {
                    const ghostBooking = days[drag.initialDayIndex]?.bookings.find(
                      (x) => x.id === drag.bookingId,
                    )
                    if (!ghostBooking) return null
                    const ghostTopMin = drag.targetLocalStartMin - startHour * 60
                    const ghostHeightPct =
                      (drag.durationMin / totalMinutes) * 100
                    const ghostTopPct = (ghostTopMin / totalMinutes) * 100
                    const hue = hueFromId(ghostBooking.professionalId)
                    return (
                      <div
                        key="ghost"
                        className="absolute rounded-md pointer-events-none p-1.5 text-xs"
                        style={{
                          top: `${ghostTopPct}%`,
                          height: `${ghostHeightPct}%`,
                          left: 2,
                          right: 2,
                          zIndex: 2,
                          backgroundColor: `hsl(${hue} 70% 92% / 0.7)`,
                          border: `2px dashed hsl(${hue} 60% 45%)`,
                          color: `hsl(${hue} 60% 25%)`,
                        }}
                      >
                        <div className="font-semibold leading-tight">
                          {minutesToHHMM(drag.targetLocalStartMin)}
                        </div>
                      </div>
                    )
                  })()
                : null}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: chips de dia + lista do dia selecionado */}
      <div className="mt-4 md:hidden">
        <div className="-mx-4 px-4 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {days.map((d, i) => {
            const isSelected = i === mobileDayIdx
            const count = d.bookings.length
            return (
              <button
                key={d.dateIso}
                type="button"
                onClick={() => setMobileDayIdx(i)}
                className={`shrink-0 min-w-[60px] rounded-md border px-3 py-2 text-center transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : d.isToday
                      ? "border-primary/40 text-primary"
                      : "border-border text-foreground hover:bg-muted"
                }`}
                aria-pressed={isSelected}
              >
                <div className="text-[10px] uppercase tracking-wide opacity-80">
                  {WEEKDAY_SHORT[i]}
                </div>
                <div className="text-sm font-semibold">{d.dayLabel}</div>
                {count > 0 ? (
                  <div
                    className={`mt-1 text-[10px] ${isSelected ? "opacity-90" : "text-muted-foreground"}`}
                  >
                    {count}
                  </div>
                ) : null}
              </button>
            )
          })}
        </div>

        {mobileDay ? (
          <ul className="mt-3 space-y-2">
            {mobileTimeline.length === 0 ? (
              <li className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Nenhum agendamento ou bloqueio neste dia.
              </li>
            ) : (
              mobileTimeline.map((item) => {
                if (item.kind === "booking") {
                  const b = item.data
                  const hue = hueFromId(b.professionalId)
                  const isFinal =
                    b.status === "CANCELLED" || b.status === "COMPLETED"
                  return (
                    <li key={b.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(b)}
                        className="w-full rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
                        style={{
                          borderLeftWidth: 4,
                          borderLeftColor: `hsl(${hue} 60% 50%)`,
                          opacity: isFinal ? 0.65 : 1,
                        }}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-semibold text-sm">
                            {b.startLabel} — {b.endLabel}
                          </span>
                          <Badge
                            variant={
                              b.status === "COMPLETED" ? "default" : "secondary"
                            }
                            className="text-[10px]"
                          >
                            {STATUS_LABEL[b.status]}
                          </Badge>
                        </div>
                        <div
                          className="mt-1 text-sm font-medium"
                          style={{
                            textDecoration:
                              b.status === "CANCELLED" ? "line-through" : undefined,
                          }}
                        >
                          {b.clientName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {b.serviceName} · {b.professionalName}
                        </div>
                      </button>
                    </li>
                  )
                }
                const blk = item.data
                return (
                  <li
                    key={`${blk.id}-${blk.localStartMin}`}
                    className="rounded-lg border border-dashed p-3 text-sm"
                    style={{
                      background:
                        "repeating-linear-gradient(-45deg, hsl(220 9% 94%) 0 6px, hsl(220 9% 97%) 6px 14px)",
                    }}
                  >
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Lock className="size-3.5 shrink-0" aria-hidden />
                      <span className="font-semibold text-foreground/80">
                        {minutesToHHMM(blk.localStartMin)} —{" "}
                        {minutesToHHMM(blk.localEndMin)}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {blk.reason ?? "Bloqueio"}
                      {" · "}
                      {blk.professionalName ?? "Todo o salão"}
                    </div>
                  </li>
                )
              })
            )}
          </ul>
        ) : null}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>{selected.clientName}</DialogTitle>
                <DialogDescription>
                  {selected.serviceName} · {selected.professionalName}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge
                    variant={
                      selected.status === "COMPLETED" ? "default" : "secondary"
                    }
                  >
                    {STATUS_LABEL[selected.status]}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quando</span>
                  <span>
                    {selected.startLabel} — {selected.endLabel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">WhatsApp</span>
                  <a
                    href={`https://wa.me/${selected.clientPhone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    {selected.clientPhone}
                  </a>
                </div>
                {selected.notes ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Observação</span>
                    <span className="text-right max-w-[60%]">{selected.notes}</span>
                  </div>
                ) : null}
              </div>
              <DialogFooter className="!justify-between sm:!justify-between">
                <Button
                  variant="outline"
                  onClick={() => setSelected(null)}
                  disabled={pending}
                >
                  Fechar
                </Button>
                {canActOnSelected ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => changeStatus("NO_SHOW", "não compareceu")}
                      disabled={pending}
                    >
                      <UserX className="size-4" />
                      Não veio
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => changeStatus("CANCELLED", "cancelado")}
                      disabled={pending}
                    >
                      <XCircle className="size-4" />
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => changeStatus("COMPLETED", "concluído")}
                      disabled={pending}
                    >
                      <Check className="size-4" />
                      Concluir
                    </Button>
                  </div>
                ) : null}
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
