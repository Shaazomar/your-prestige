"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { AField } from "@/components/admin/FormField";
import {
  getBusinessSettings, saveBusinessSettings, getThemeSettings, saveThemeSettings, getIntegrationStatuses,
  type BusinessSettings, type ThemeSettings, type IntegrationStatus,
} from "./actions";

export function SettingsManager({ canEdit }: { canEdit: boolean }) {
  const [business, setBusiness] = useState<BusinessSettings | null>(null);
  const [theme, setTheme] = useState<ThemeSettings | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);

  useEffect(() => {
    getBusinessSettings().then(setBusiness);
    getThemeSettings().then(setTheme);
    getIntegrationStatuses().then(setIntegrations);
  }, []);

  async function handleBusinessSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!business) return;
    setSavingBusiness(true);
    try {
      await saveBusinessSettings(business);
      toast.success("Business details saved");
    } catch {
      toast.error("Save failed");
    } finally {
      setSavingBusiness(false);
    }
  }

  async function handleThemeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!theme) return;
    setSavingTheme(true);
    try {
      await saveThemeSettings(theme);
      toast.success("Theme saved");
    } catch {
      toast.error("Save failed");
    } finally {
      setSavingTheme(false);
    }
  }

  if (!business || !theme) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-white/8 bg-[#141413]">
        <Loader2 className="h-6 w-6 animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={handleBusinessSubmit} className="space-y-4 rounded-2xl border border-white/8 bg-[#141413] p-6">
        <p className="text-sm font-medium text-white/70">Business Details</p>
        <AField label="Business Name" value={business.name} onChange={(e) => setBusiness((b) => b && { ...b, name: e.target.value })} disabled={!canEdit} />
        <AField label="Phone" value={business.phone} onChange={(e) => setBusiness((b) => b && { ...b, phone: e.target.value })} disabled={!canEdit} />
        <AField label="Email" type="email" value={business.email} onChange={(e) => setBusiness((b) => b && { ...b, email: e.target.value })} disabled={!canEdit} />
        <AField label="Address" value={business.address} onChange={(e) => setBusiness((b) => b && { ...b, address: e.target.value })} disabled={!canEdit} />
        <AField label="Google Maps URL" value={business.mapUrl} onChange={(e) => setBusiness((b) => b && { ...b, mapUrl: e.target.value })} disabled={!canEdit} />
        <AField label="Business Hours" value={business.hours} onChange={(e) => setBusiness((b) => b && { ...b, hours: e.target.value })} disabled={!canEdit} />
        {canEdit && (
          <button type="submit" disabled={savingBusiness} className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep disabled:opacity-60">
            {savingBusiness ? "Saving…" : "Save Business Details"}
          </button>
        )}
      </form>

      <div className="space-y-6">
        <form onSubmit={handleThemeSubmit} className="space-y-4 rounded-2xl border border-white/8 bg-[#141413] p-6">
          <p className="text-sm font-medium text-white/70">Theme</p>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-white/70">Accent Color</span>
            <div className="flex items-center gap-3">
              <input type="color" value={theme.accent} onChange={(e) => setTheme({ accent: e.target.value })} disabled={!canEdit} className="h-11 w-14 rounded-lg border border-white/10 bg-transparent" />
              <span className="font-mono text-sm text-white/60">{theme.accent}</span>
            </div>
          </label>
          {canEdit && (
            <button type="submit" disabled={savingTheme} className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep disabled:opacity-60">
              {savingTheme ? "Saving…" : "Save Theme"}
            </button>
          )}
        </form>

        <div className="space-y-3 rounded-2xl border border-white/8 bg-[#141413] p-6">
          <p className="text-sm font-medium text-white/70">Integrations</p>
          <p className="text-xs text-white/35">
            Credentials are configured via environment variables, not this UI — see progress.md for setup steps.
          </p>
          <div className="space-y-2 pt-2">
            {integrations.map((i) => (
              <div key={i.name} className="flex items-center justify-between rounded-xl border border-white/8 px-4 py-3">
                <div>
                  <p className="text-sm text-white/80">{i.name}</p>
                  <p className="font-mono text-[0.65rem] text-white/25">{i.envVars.join(", ")}</p>
                </div>
                {i.configured ? (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" /> Configured
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-white/30">
                    <XCircle className="h-4 w-4" /> Not Configured
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
