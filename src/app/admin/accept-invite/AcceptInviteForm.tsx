"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { acceptInviteAction, type AcceptInviteState } from "./actions";

const initial: AcceptInviteState = {};

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(acceptInviteAction, initial);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-white/60">Set a Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white outline-none focus:border-gold"
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-white/60">Confirm Password</span>
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white outline-none focus:border-gold"
        />
      </label>
      {state?.error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{state.error}</p>}
      <button type="submit" disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3.5 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep disabled:opacity-60">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set Password & Sign In"}
      </button>
    </form>
  );
}
