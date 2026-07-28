"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AField, ASelect, AToggle } from "@/components/admin/FormField";
import { redirectSchema, type RedirectInput } from "./schema";
import { createRedirect, updateRedirect } from "./actions";
import type { Redirect } from "@prisma/client";

const empty: RedirectInput = { fromPath: "", toPath: "", statusCode: 301, active: true };

export function RedirectForm({ redirect, onSuccess }: { redirect: Redirect | null; onSuccess: () => void }) {
  const [values, setValues] = useState<RedirectInput>(
    redirect ? { fromPath: redirect.fromPath, toPath: redirect.toPath, statusCode: redirect.statusCode, active: redirect.active } : empty
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = redirectSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      if (redirect) {
        await updateRedirect(redirect.id, parsed.data);
        toast.success("Redirect updated");
      } else {
        await createRedirect(parsed.data);
        toast.success("Redirect created");
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
      <AField label="From Path" required value={values.fromPath} onChange={(e) => setValues((v) => ({ ...v, fromPath: e.target.value }))} error={errors.fromPath} placeholder="/old-page" disabled={!!redirect} />
      <AField label="To Path / URL" required value={values.toPath} onChange={(e) => setValues((v) => ({ ...v, toPath: e.target.value }))} error={errors.toPath} placeholder="/new-page" />
      <ASelect label="Status Code" value={values.statusCode} onChange={(e) => setValues((v) => ({ ...v, statusCode: Number(e.target.value) }))}>
        <option value={301}>301 — Permanent</option>
        <option value={302}>302 — Temporary</option>
        <option value={307}>307 — Temporary (strict)</option>
        <option value={308}>308 — Permanent (strict)</option>
      </ASelect>
      <AToggle label="Active" checked={values.active} onChange={(active) => setValues((v) => ({ ...v, active }))} />
      <button type="submit" disabled={saving} className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep disabled:opacity-60">
        {saving ? "Saving…" : redirect ? "Save Changes" : "Create Redirect"}
      </button>
    </form>
  );
}
