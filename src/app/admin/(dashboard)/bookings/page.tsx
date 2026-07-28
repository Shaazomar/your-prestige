import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { BookingsManager } from "./BookingsManager";

export const metadata = { title: "Bookings" };

export default async function BookingsPage() {
  const session = await auth();
  const role = session!.user.role;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
        <p className="mt-1 text-sm text-white/40">
          Showroom visit requests — confirm, reschedule, assign a consultant and send reminders.
        </p>
      </div>
      <BookingsManager
        permissions={{
          create: can(role, "bookings", "create"),
          edit: can(role, "bookings", "edit"),
          delete: can(role, "bookings", "delete"),
        }}
      />
    </div>
  );
}
