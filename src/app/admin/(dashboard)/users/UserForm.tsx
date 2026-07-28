"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AField, ASelect } from "@/components/admin/FormField";
import { inviteUserSchema, editUserSchema, type InviteUserInput } from "./schema";
import { inviteUser, updateUser } from "./actions";
import type { UserRow } from "./actions";
import type { Role } from "@prisma/client";

const roleOptions: { value: Role; label: string }[] = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "OWNER", label: "Owner" },
  { value: "MARKETING", label: "Marketing" },
  { value: "CONTENT", label: "Content Editor" },
  { value: "SEO", label: "SEO Specialist" },
  { value: "SUPPORT", label: "Support" },
  { value: "VIEWER", label: "Viewer" },
];

export function UserForm({ user, onSuccess }: { user: UserRow | null; onSuccess: () => void }) {
  const [values, setValues] = useState<InviteUserInput>(
    user ? { name: user.name, email: user.email, role: user.role } : { name: "", email: "", role: "VIEWER" }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const schema = user ? editUserSchema : inviteUserSchema;
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      if (user) {
        await updateUser(user.id, parsed.data);
        toast.success("User updated");
      } else {
        await inviteUser(parsed.data as InviteUserInput);
        toast.success(`Invite sent to ${values.email}`);
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
      <AField label="Name" required value={values.name} onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))} error={errors.name} />
      <AField label="Email" required type="email" value={values.email} onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))} error={errors.email} disabled={!!user} hint={user ? "Email cannot be changed" : undefined} />
      <ASelect label="Role" value={values.role} onChange={(e) => setValues((v) => ({ ...v, role: e.target.value as Role }))}>
        {roleOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
      </ASelect>
      <button type="submit" disabled={saving} className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep disabled:opacity-60">
        {saving ? "Saving…" : user ? "Save Changes" : "Send Invite"}
      </button>
    </form>
  );
}
