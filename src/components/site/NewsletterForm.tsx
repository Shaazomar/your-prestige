"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type State = "idle" | "sending" | "done" | "error";

/**
 * Footer newsletter signup.
 *
 * Posts to /api/subscribe, which stores a Subscriber row. It reports real
 * outcomes — a failure says so rather than showing a success state, which is
 * what the pre-2.0 footer did (its form had no submit handler at all).
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "sending") return;

    setState("sending");
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data: { error?: string } = await res.json().catch(() => ({}));

      if (!res.ok) {
        setState("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setState("done");
      setEmail("");
    } catch {
      setState("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (state === "done") {
    return (
      <p className="flex items-center gap-2.5 text-sm text-gold" role="status">
        <Check className="h-4 w-4" aria-hidden="true" />
        You&rsquo;re on the list. We&rsquo;ll be in touch.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="flex items-center gap-3 border-b border-line pb-3 transition-colors focus-within:border-gold">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          autoComplete="email"
          aria-invalid={state === "error"}
          className="min-w-0 flex-1 bg-transparent text-sm text-text placeholder:text-faint focus:outline-none"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          aria-label="Subscribe"
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-full",
            "text-muted transition-colors duration-500",
            "hover:text-gold disabled:opacity-40"
          )}
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {state === "error" && (
        <p className="mt-2.5 text-sm text-error" role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
