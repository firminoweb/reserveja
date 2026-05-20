"use server"

import { revalidatePath } from "next/cache"
import type { BookingStatus } from "@prisma/client"

import { requireOwnerMembership } from "@/server/auth/guards"
import {
  BookingStatusError,
  updateBookingStatus,
} from "@/server/booking/update-status"
import {
  RescheduleError,
  rescheduleBooking,
} from "@/server/booking/reschedule"

export async function setBookingStatusAction(
  bookingId: string,
  next: BookingStatus,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { establishment } = await requireOwnerMembership()
  try {
    await updateBookingStatus(establishment.id, bookingId, next)
    revalidatePath("/painel")
    revalidatePath("/painel/agenda")
    return { ok: true }
  } catch (err) {
    if (err instanceof BookingStatusError) {
      return { ok: false, message: err.message }
    }
    throw err
  }
}

export async function rescheduleBookingAction(
  bookingId: string,
  newStartsAtIso: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { establishment } = await requireOwnerMembership()
  try {
    await rescheduleBooking(
      establishment.id,
      bookingId,
      new Date(newStartsAtIso),
    )
    revalidatePath("/painel")
    revalidatePath("/painel/agenda")
    return { ok: true }
  } catch (err) {
    if (err instanceof RescheduleError) {
      return { ok: false, message: err.message }
    }
    throw err
  }
}
