"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { upsertCalendarEvent, deleteCalendarEvent } from "@/lib/google-calendar";
import { sendEmail } from "@/lib/email";
import type { ListParams, ListResult } from "@/hooks/useAdminList";
import { bookingSchema, type BookingInput } from "./schema";
import type { Prisma } from "@prisma/client";

export type BookingRow = Prisma.BookingGetPayload<{
  include: { assignedConsultant: { select: { id: true; name: true } } };
}>;

export async function listBookings(params: ListParams): Promise<ListResult<BookingRow>> {
  await requirePermission("bookings", "view");

  const where: Prisma.BookingWhereInput = {
    deletedAt: params.trash ? { not: null } : null,
    ...(params.search
      ? { OR: [{ name: { contains: params.search, mode: "insensitive" } }, { phone: { contains: params.search, mode: "insensitive" } }] }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: { assignedConsultant: { select: { id: true, name: true } } },
      orderBy: { [params.sortBy]: params.sortDir },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.booking.count({ where }),
  ]);

  return { rows, total };
}

/** All non-deleted bookings, unpaginated — powers the calendar view. */
export async function listAllBookingsForCalendar(): Promise<BookingRow[]> {
  await requirePermission("bookings", "view");
  return prisma.booking.findMany({
    where: { deletedAt: null },
    include: { assignedConsultant: { select: { id: true, name: true } } },
    orderBy: { requestedDate: "asc" },
  });
}

export async function getConsultants() {
  await requirePermission("bookings", "view");
  return prisma.user.findMany({
    where: {
      status: "ACTIVE",
      role: { in: ["SUPER_ADMIN", "MANAGER", "SHOWROOM_INCHARGE", "SHOWROOM_STAFF"] },
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function createBooking(input: BookingInput) {
  const session = await requirePermission("bookings", "create");
  const data = bookingSchema.parse(input);

  const booking = await prisma.booking.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      requestedDate: new Date(data.requestedDate),
      status: data.status,
      notes: data.notes || null,
      assignedConsultantId: data.assignedConsultantId || null,
    },
  });

  const eventId = await upsertCalendarEvent(booking);
  if (eventId) await prisma.booking.update({ where: { id: booking.id }, data: { googleEventId: eventId } });

  await logAudit({ action: "booking.create", entity: "Booking", entityId: booking.id, newValue: booking, meta: { by: session.user.id } });
  return booking;
}

export async function updateBooking(id: string, input: BookingInput) {
  const session = await requirePermission("bookings", "edit");
  const data = bookingSchema.parse(input);

  const before = await prisma.booking.findUniqueOrThrow({ where: { id } });
  const booking = await prisma.booking.update({
    where: { id },
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      requestedDate: new Date(data.requestedDate),
      status: data.status,
      notes: data.notes || null,
      assignedConsultantId: data.assignedConsultantId || null,
    },
  });

  const eventId = await upsertCalendarEvent(booking, before.googleEventId);
  if (eventId && eventId !== before.googleEventId) {
    await prisma.booking.update({ where: { id }, data: { googleEventId: eventId } });
  }

  await logAudit({ action: "booking.update", entity: "Booking", entityId: id, oldValue: before, newValue: booking, meta: { by: session.user.id } });
  return booking;
}

async function setStatus(id: string, status: "CONFIRMED" | "REJECTED" | "CANCELLED" | "COMPLETED" | "NO_SHOW") {
  const session = await requirePermission("bookings", "edit");
  const before = await prisma.booking.findUniqueOrThrow({ where: { id } });
  const booking = await prisma.booking.update({ where: { id }, data: { status } });
  await logAudit({ action: `booking.${status.toLowerCase()}`, entity: "Booking", entityId: id, oldValue: { status: before.status }, newValue: { status }, meta: { by: session.user.id } });
  return booking;
}

export async function confirmBooking(id: string) {
  return setStatus(id, "CONFIRMED");
}
export async function rejectBooking(id: string) {
  return setStatus(id, "REJECTED");
}
export async function cancelBooking(id: string) {
  return setStatus(id, "CANCELLED");
}
export async function completeBooking(id: string) {
  return setStatus(id, "COMPLETED");
}
export async function markNoShow(id: string) {
  return setStatus(id, "NO_SHOW");
}

export async function rescheduleBooking(id: string, newDate: string) {
  const session = await requirePermission("bookings", "edit");
  const before = await prisma.booking.findUniqueOrThrow({ where: { id } });
  const booking = await prisma.booking.update({
    where: { id },
    data: { requestedDate: new Date(newDate), status: "RESCHEDULED" },
  });

  const eventId = await upsertCalendarEvent(booking, before.googleEventId);
  if (eventId && eventId !== before.googleEventId) {
    await prisma.booking.update({ where: { id }, data: { googleEventId: eventId } });
  }

  await logAudit({
    action: "booking.reschedule",
    entity: "Booking",
    entityId: id,
    oldValue: { requestedDate: before.requestedDate },
    newValue: { requestedDate: booking.requestedDate },
    meta: { by: session.user.id },
  });
  return booking;
}

export async function assignConsultant(id: string, consultantId: string | null) {
  const session = await requirePermission("bookings", "edit");
  const booking = await prisma.booking.update({ where: { id }, data: { assignedConsultantId: consultantId } });
  await logAudit({ action: "booking.assign", entity: "Booking", entityId: id, meta: { consultantId, by: session.user.id } });
  return booking;
}

export async function sendReminder(id: string) {
  await requirePermission("bookings", "edit");
  const booking = await prisma.booking.findUniqueOrThrow({ where: { id } });
  if (booking.email) {
    await sendEmail({
      to: booking.email,
      subject: "Your Prestige — Visit Reminder",
      html: `<p>Hi ${booking.name},</p><p>This is a reminder for your showroom visit on ${booking.requestedDate.toLocaleString(
        "en-IN"
      )}. We look forward to seeing you!</p>`,
    });
  }
  const updated = await prisma.booking.update({ where: { id }, data: { reminderSentAt: new Date() } });
  await logAudit({ action: "booking.reminder_sent", entity: "Booking", entityId: id });
  return updated;
}

export async function softDeleteBooking(id: string) {
  const session = await requirePermission("bookings", "delete");
  const before = await prisma.booking.findUniqueOrThrow({ where: { id } });
  if (before.googleEventId) await deleteCalendarEvent(before.googleEventId);
  const booking = await prisma.booking.update({ where: { id }, data: { deletedAt: new Date() } });
  await logAudit({ action: "booking.delete", entity: "Booking", entityId: id, meta: { by: session.user.id } });
  return booking;
}

export async function restoreBooking(id: string) {
  await requirePermission("bookings", "edit");
  const booking = await prisma.booking.update({ where: { id }, data: { deletedAt: null } });
  await logAudit({ action: "booking.restore", entity: "Booking", entityId: id });
  return booking;
}
