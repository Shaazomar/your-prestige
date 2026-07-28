"use client";

import { useActionState, useEffect, useState } from "react";
import { verifyBypassAction, type BypassState } from "@/app/(site)/maintenance-actions";
import { business } from "@/lib/site-config";
import { Logo } from "@/components/brand/Logo";

const initial: BypassState = {};

export function MaintenancePage({ message, countdownUntil }: { message: string; countdownUntil: string }) {
  const [state, formAction, pending] = useActionState(verifyBypassAction, initial);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!countdownUntil) return;
    const target = new Date(countdownUntil).getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) return setTimeLeft("Any moment now");
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [countdownUntil]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 text-center text-ivory">
      <Logo size="xl" tone="light" stacked withTagline />
      <h1 className="text-display-sm mt-8 max-w-lg">{message}</h1>
      {timeLeft && (
        <p className="mt-6 font-mono text-lg text-gold">{timeLeft}</p>
      )}
      <p className="mt-8 text-sm text-ivory/40">
        Need us urgently? Call {business.phone}
      </p>

      <form action={formAction} className="mt-10 flex gap-2">
        <input
          name="password"
          type="password"
          placeholder="Preview password"
          className="rounded-full border border-ivory/15 bg-white/5 px-5 py-2.5 text-sm text-ivory outline-none placeholder:text-ivory/30 focus:border-gold"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-ivory transition-colors hover:bg-gold-deep disabled:opacity-60"
        >
          {pending ? "…" : "Enter"}
        </button>
      </form>
      {state?.error && <p className="mt-3 text-xs text-red-300">{state.error}</p>}
    </div>
  );
}
