"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "assistant" | "user";
  content: string;
}

const suggestions = [
  "Show me premium tile options",
  "I'm renovating my bathroom",
  "Which brands do you carry?",
  "Book a showroom visit",
];

/**
 * AI Concierge — luxury slide-in assistant.
 * Currently powered by a lightweight intent engine at /api/concierge;
 * designed to swap to a Claude-backed endpoint without UI changes.
 */
export function Concierge({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Welcome to Your Prestige. I'm your personal design concierge — ask me about collections, brands, pricing, or let me arrange a private showroom visit.",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    const key = "prestige-concierge-session";
    let id = typeof window !== "undefined" ? sessionStorage.getItem(key) : null;
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(key, id);
    }
    sessionIdRef.current = id;
  }, []);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: trimmed }]);
    setTyping(true);
    try {
      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, sessionId: sessionIdRef.current }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "I'm having a moment — please call us at +91 98765 43210 or tap the WhatsApp button and we'll assist you right away.",
        },
      ]);
    } finally {
      setTyping(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "110%" }}
            animate={{ x: 0 }}
            exit={{ x: "110%" }}
            transition={{ type: "spring", damping: 28, stiffness: 240 }}
            className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col bg-ivory shadow-float md:bottom-6 md:right-6 md:top-6 md:rounded-3xl"
            role="dialog"
            aria-label="AI Concierge"
          >
            {/* Header */}
            <div className="flex items-center justify-between rounded-t-3xl bg-ink px-6 py-5 text-ivory">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20">
                  <Sparkles className="h-5 w-5 text-gold" />
                </span>
                <div>
                  <p className="text-sm font-semibold tracking-wide">Prestige Concierge</p>
                  <p className="flex items-center gap-1.5 text-xs text-ivory/50">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Online now
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close concierge"
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-ivory/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-6">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4.5 py-3 text-sm leading-relaxed",
                      m.role === "user"
                        ? "rounded-br-md bg-ink text-ivory"
                        : "rounded-bl-md bg-white text-ink shadow-soft"
                    )}
                  >
                    {m.content}
                  </div>
                </motion.div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="flex gap-1.5 rounded-2xl rounded-bl-md bg-white px-5 py-4 shadow-soft">
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        className="h-1.5 w-1.5 rounded-full bg-stone-400"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.9, delay: d * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-2 px-5 pb-3">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-ink/10 bg-white px-3.5 py-2 text-xs font-medium text-slate-warm transition-all duration-300 hover:border-gold hover:text-gold"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t hairline px-4 py-4"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything…"
                aria-label="Message the concierge"
                className="flex-1 rounded-full border border-ink/10 bg-white px-5 py-3 text-sm outline-none transition-colors focus:border-gold"
              />
              <button
                type="submit"
                aria-label="Send message"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-ivory transition-colors duration-300 hover:bg-gold disabled:opacity-40"
                disabled={!input.trim() || typing}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
