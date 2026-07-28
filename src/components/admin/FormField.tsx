"use client";

import { cn } from "@/lib/utils";
import type {
  InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode,
} from "react";

const base = [
  "w-full rounded-xl border bg-white/5 px-4 py-2.5 text-sm text-white",
  "placeholder:text-white/25 transition-colors duration-200",
  "border-white/10 hover:border-white/20",
  "focus:border-gold focus:outline-none",
].join(" ");

interface LabelledProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export function AField({
  label,
  error,
  hint,
  required,
  className,
  ...props
}: LabelledProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-white/70">
        {label}
        {required && <span className="text-gold"> *</span>}
      </span>
      <input className={cn(base, error && "border-red-500/50", className)} {...props} />
      {hint && !error && <span className="mt-1 block text-xs text-white/30">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
    </label>
  );
}

export function ATextArea({
  label,
  error,
  hint,
  required,
  className,
  ...props
}: LabelledProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-white/70">
        {label}
        {required && <span className="text-gold"> *</span>}
      </span>
      <textarea rows={4} className={cn(base, "resize-none", error && "border-red-500/50", className)} {...props} />
      {hint && !error && <span className="mt-1 block text-xs text-white/30">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
    </label>
  );
}

export function ASelect({
  label,
  error,
  hint,
  required,
  className,
  children,
  ...props
}: LabelledProps & SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-white/70">
        {label}
        {required && <span className="text-gold"> *</span>}
      </span>
      <select className={cn(base, "appearance-none", error && "border-red-500/50", className)} {...props}>
        {children}
      </select>
      {hint && !error && <span className="mt-1 block text-xs text-white/30">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
    </label>
  );
}

export function AToggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-white/80">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-white/30">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300",
          checked ? "bg-gold" : "bg-white/15"
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-4 w-4 rounded-full bg-white transition-transform duration-300",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}

/** Comma-separated tag/string-array input — used for sizes, applications, tags, etc. */
export function ATagInput({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-white/70">{label}</span>
      <input
        defaultValue={value.join(", ")}
        onBlur={(e) =>
          onChange(
            e.target.value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          )
        }
        placeholder={placeholder ?? "Comma-separated…"}
        className={base}
      />
      {hint && <span className="mt-1 block text-xs text-white/30">{hint}</span>}
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((v) => (
            <span
              key={v}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/60"
            >
              {v}
            </span>
          ))}
        </div>
      )}
    </label>
  );
}
