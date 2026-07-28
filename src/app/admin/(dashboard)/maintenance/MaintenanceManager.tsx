"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AField, ATextArea, AToggle, ATagInput } from "@/components/admin/FormField";
import { AlertTriangle, Loader2 } from "lucide-react";
import { getMaintenanceSettings, saveMaintenanceSettings, type MaintenanceSettings } from "./actions";

export function MaintenanceManager({ canEdit }: { canEdit: boolean }) {
  const [settings, setSettings] = useState<MaintenanceSettings | null>(null);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMaintenanceSettings().then(setSettings);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      await saveMaintenanceSettings({ ...settings, password: password || undefined });
      toast.success("Maintenance settings saved");
      setPassword("");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-white/8 bg-[#141413]">
        <Loader2 className="h-6 w-6 animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5 rounded-2xl border border-white/8 bg-[#141413] p-6">
      {settings.enabled && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-300">
          <AlertTriangle className="h-4 w-4" />
          Maintenance mode is currently live on the public site.
        </div>
      )}
      <AToggle label="Enable Maintenance Mode" checked={settings.enabled} onChange={(enabled) => setSettings((s) => s && { ...s, enabled })} hint="Shows a holding page to all visitors except whitelisted IPs and password-verified previewers" />
      <ATextArea label="Message" value={settings.message} onChange={(e) => setSettings((s) => s && { ...s, message: e.target.value })} disabled={!canEdit} />
      <AField label="Countdown Until" type="datetime-local" value={settings.countdownUntil} onChange={(e) => setSettings((s) => s && { ...s, countdownUntil: e.target.value })} disabled={!canEdit} hint="Optional — leave blank to hide the countdown" />
      <ATagInput label="IP Whitelist" value={settings.whitelist} onChange={(whitelist) => setSettings((s) => s && { ...s, whitelist })} placeholder="203.0.113.1, 198.51.100.2" />
      <AField label="Preview Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={!canEdit} hint={settings.hasPassword ? "A password is already set — enter a new one to change it" : "Set a password visitors can use to bypass the holding page"} />
      {canEdit && (
        <button type="submit" disabled={saving} className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep disabled:opacity-60">
          {saving ? "Saving…" : "Save Maintenance Settings"}
        </button>
      )}
    </form>
  );
}
