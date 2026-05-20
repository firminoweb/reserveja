import { addMinutes } from "date-fns"

import { db } from "@/lib/db"
import { sendBookingReminder } from "@/server/notifications/booking"

const WINDOW_BEFORE_MIN = 55
const WINDOW_AFTER_MIN = 65

export type ReminderRunSummary = {
  scanned: number
  sent: number
  failed: number
}

/**
 * Busca bookings ativos cuja hora inicial cai entre 55-65 min no futuro e que
 * ainda não receberam lembrete. Envia + marca reminderSentAt.
 *
 * Idempotente: rodar 2x não causa envio duplicado porque marcamos antes do
 * próximo scan. Janela de 10 min cobre cron a cada 5 min (se um tick perder,
 * o próximo pega).
 */
export async function dispatchDueReminders(): Promise<ReminderRunSummary> {
  const now = new Date()
  const windowStart = addMinutes(now, WINDOW_BEFORE_MIN)
  const windowEnd = addMinutes(now, WINDOW_AFTER_MIN)

  const due = await db.booking.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      reminderSentAt: null,
      startsAt: { gte: windowStart, lte: windowEnd },
    },
    select: { id: true },
  })

  let sent = 0
  let failed = 0

  for (const b of due) {
    const ok = await sendBookingReminder(b.id)
    if (ok) {
      await db.booking.update({
        where: { id: b.id },
        data: { reminderSentAt: new Date() },
      })
      sent++
    } else {
      failed++
    }
  }

  return { scanned: due.length, sent, failed }
}
