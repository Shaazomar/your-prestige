"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AField, ATextArea, ASelect } from "@/components/admin/FormField";
import { bookingSchema, type BookingInput } from "./schema";
import { createBooking, updateBooking, getConsultants } from "./actions";
import type { BookingRow } from "./actions";

const empty: BookingInput = { name: "", phone: "", email: "", requestedDate: "", status: "PENDING", notes: "", assignedConsultantId: null };

function toDatetimeLocal(date: Date) {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
}

export function BookingForm({ booking, onSuccess }: { booking: BookingRow | null; onSuccess: () => void }) {
  const [values, setValues] = useState<BookingInput>(
    booking
      ? {
          name: booking.name,
          phone: booking.phone,
          email: booking.email ?? "",
          requestedDate: toDatetimeLocal(booking.requestedDate),
          status: booking.status,
          notes: booking.notes ?? "",
          assignedConsultantId: booking.assignedConsultantId,
        }
      : empty
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [consultants, setConsultants] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getConsultants().then(setConsultants);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = bookingSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      if (booking) {
        await updateBooking(booking.id, parsed.data);
        toast.success("Booking updated");
      } else {
        await createBooking(parsed.data);
        toast.success("Booking created");
      }
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <AField label="Name" required value={values.name} onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))} error={errors.name} />
        <AField label="Phone" required value={values.phone} onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))} error={errors.phone} />
      </div>
      <AField label="Email" type="email" value={values.email} onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))} hint="Used for reminder emails, if configured" />
      <AField label="Requested Date & Time" type="datetime-local" required value={values.requestedDate} onChange={(e) => setValues((v) => ({ ...v, requestedDate: e.target.value }))} error={errors.requestedDate} />
      <div className="grid grid-cols-2 gap-4">
        <ASelect label="Status" value={values.status} onChange={(e) => setValues((v) => ({ ...v, status: e.target.value as BookingInput["status"] }))}>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="RESCHEDULED">Rescheduled</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REJECTED">Rejected</option>
          <option value="NO_SHOW">No Show</option>
        </ASelect>
        <ASelect label="Assign Consultant" value={values.assignedConsultantId ?? ""} onChange={(e) => setValues((v) => ({ ...v, assignedConsultantId: e.target.value || null }))}>
          <option value="">Unassigned</option>
          {consultants.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </ASelect>
      </div>
      <ATextArea label="Notes" value={values.notes} onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))} />
      <button type="submit" disabled={saving} className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep disabled:opacity-60">
        {saving ? "Saving…" : booking ? "Save Changes" : "Create Booking"}
      </button>
    </form>
  );
}
