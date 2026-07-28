"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { listAllBookingsForCalendar, type BookingRow } from "./actions";

const statusDot: Record<string, string> = {
  PENDING: "bg-gold",
  CONFIRMED: "bg-emerald-400",
  RESCHEDULED: "bg-amber-400",
  COMPLETED: "bg-sky-400",
  CANCELLED: "bg-white/30",
  REJECTED: "bg-red-400",
  NO_SHOW: "bg-red-400",
};

export function BookingsCalendar({ onSelect }: { onSelect: (booking: BookingRow) => void }) {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAllBookingsForCalendar().then((rows) => {
      setBookings(rows);
      setLoading(false);
    });
  }, []);

  const days = useMemo(() => {
    const year = month.getFullYear();
    const m = month.getMonth();
    const firstDay = new Date(year, m, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, m + 1, 0).getDate();

    const cells: (Date | null)[] = Array.from({ length: startOffset }, () => null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, m, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [month]);

  function bookingsOn(date: Date) {
    return bookings.filter((b) => new Date(b.requestedDate).toDateString() === date.toDateString());
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-white/8 bg-[#141413]">
        <Loader2 className="h-6 w-6 animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-[#141413] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {month.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
        </h3>
        <div className="flex gap-1">
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/8 hover:text-white">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => setMonth(new Date())} className="rounded-lg px-3 py-1.5 text-xs text-white/50 hover:bg-white/8 hover:text-white">
            Today
          </button>
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/8 hover:text-white">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-white/30">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="pb-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((date, i) => {
          const dayBookings = date ? bookingsOn(date) : [];
          const isToday = date && date.toDateString() === new Date().toDateString();
          return (
            <div
              key={i}
              className={cn(
                "min-h-20 rounded-lg border p-1.5 text-left",
                date ? "border-white/8 bg-white/[0.02]" : "border-transparent",
                isToday && "border-gold/40"
              )}
            >
              {date && (
                <>
                  <p className={cn("mb-1 text-xs", isToday ? "font-bold text-gold" : "text-white/40")}>{date.getDate()}</p>
                  <div className="space-y-0.5">
                    {dayBookings.slice(0, 3).map((b) => (
                      <button
                        key={b.id}
                        onClick={() => onSelect(b)}
                        className="flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[0.65rem] text-white/70 hover:bg-white/8"
                      >
                        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", statusDot[b.status])} />
                        <span className="truncate">{b.name}</span>
                      </button>
                    ))}
                    {dayBookings.length > 3 && <p className="px-1 text-[0.6rem] text-white/30">+{dayBookings.length - 3} more</p>}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
