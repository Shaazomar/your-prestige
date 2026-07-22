"use client";

import { cn } from "@/lib/utils";
import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const fieldBase = [
  "w-full rounded-2xl border bg-white/60 px-5 py-4 text-ink",
  "placeholder:text-stone-400 transition-all duration-300",
  "border-ink/10 hover:border-ink/20",
  "focus:border-gold focus:outline-none focus:ring-4 focus:ring-gold/10",
].join(" ");

interface LabelledProps {
  label: string;
  error?: string;
}

export function TextField({
  label,
  error,
  className,
  ...props
}: LabelledProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-warm">{label}</span>
      <input className={cn(fieldBase, error && "border-red-400", className)} {...props} />
      {error && <span className="mt-1.5 block text-xs text-red-500">{error}</span>}
    </label>
  );
}

export function TextArea({
  label,
  error,
  className,
  ...props
}: LabelledProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-warm">{label}</span>
      <textarea
        rows={4}
        className={cn(fieldBase, "resize-none", error && "border-red-400", className)}
        {...props}
      />
      {error && <span className="mt-1.5 block text-xs text-red-500">{error}</span>}
    </label>
  );
}

export function SelectField({
  label,
  error,
  className,
  children,
  ...props
}: LabelledProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-warm">{label}</span>
      <select className={cn(fieldBase, "appearance-none", error && "border-red-400", className)} {...props}>
        {children}
      </select>
      {error && <span className="mt-1.5 block text-xs text-red-500">{error}</span>}
    </label>
  );
}
