"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { AField, ATextArea, AToggle } from "@/components/admin/FormField";
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
      toast.success("Settings saved successfully");
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
    <div className="grid gap-6 xl:grid-cols-3">
      {/* Column 1: Business Details */}
      <form onSubmit={handleBusinessSubmit} className="space-y-4 rounded-2xl border border-white/8 bg-[#141413] p-6">
        <div>
          <h3 className="text-sm font-semibold text-white/80">Business Profile</h3>
          <p className="text-xs text-white/40 mb-3">General showroom settings & public contact profile.</p>
        </div>
        <AField label="Business Name" value={business.name} onChange={(e) => setBusiness((b) => b && { ...b, name: e.target.value })} disabled={!canEdit} />
        <AField label="Phone" value={business.phone} onChange={(e) => setBusiness((b) => b && { ...b, phone: e.target.value })} disabled={!canEdit} />
        <AField label="Email" type="email" value={business.email} onChange={(e) => setBusiness((b) => b && { ...b, email: e.target.value })} disabled={!canEdit} />
        <AField label="Address" value={business.address} onChange={(e) => setBusiness((b) => b && { ...b, address: e.target.value })} disabled={!canEdit} />
        <AField label="Google Maps URL" value={business.mapUrl} onChange={(e) => setBusiness((b) => b && { ...b, mapUrl: e.target.value })} disabled={!canEdit} />
        <AField label="Business Hours" value={business.hours} onChange={(e) => setBusiness((b) => b && { ...b, hours: e.target.value })} disabled={!canEdit} />
        
        {canEdit && (
          <button type="submit" disabled={savingBusiness} className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep disabled:opacity-60">
            {savingBusiness ? "Saving…" : "Save Profile Details"}
          </button>
        )}
      </form>

      {/* Column 2: WhatsApp Commerce Settings */}
      <form onSubmit={handleBusinessSubmit} className="space-y-4 rounded-2xl border border-white/8 bg-[#141413] p-6">
        <div>
          <h3 className="text-sm font-semibold text-white/80">WhatsApp Commerce</h3>
          <p className="text-xs text-white/40 mb-3">Configure how customers place orders and enquirers chat on WhatsApp.</p>
        </div>
        
        <AField 
          label="WhatsApp Ordering Number" 
          value={business.whatsappNumber} 
          onChange={(e) => setBusiness((b) => b && { ...b, whatsappNumber: e.target.value })} 
          placeholder="+91XXXXXXXXXX"
          disabled={!canEdit}
          hint="Must include country code, e.g., +919008919195" 
        />

        <AField 
          label="WhatsApp Display Name" 
          value={business.whatsappDisplayName} 
          onChange={(e) => setBusiness((b) => b && { ...b, whatsappDisplayName: e.target.value })} 
          placeholder="Prestige Tiles Orders"
          disabled={!canEdit}
        />

        <ATextArea 
          label="Default Greeting" 
          value={business.whatsappGreeting} 
          onChange={(e) => setBusiness((b) => b && { ...b, whatsappGreeting: e.target.value })} 
          placeholder="Hello! Welcome to Prestige Tiles."
          disabled={!canEdit}
        />

        <ATextArea 
          label="Default Order Message" 
          value={business.whatsappDefaultMessage} 
          onChange={(e) => setBusiness((b) => b && { ...b, whatsappDefaultMessage: e.target.value })} 
          placeholder="I would like to enquire about:..."
          disabled={!canEdit}
          hint="Pre-filled details will be appended below this text"
        />

        <AField 
          label="Support Working Hours" 
          value={business.whatsappBusinessHours} 
          onChange={(e) => setBusiness((b) => b && { ...b, whatsappBusinessHours: e.target.value })} 
          placeholder="9:00 AM – 7:00 PM"
          disabled={!canEdit}
        />

        <div className="space-y-3 pt-2">
          <AToggle label="Enable WhatsApp Features" checked={business.whatsappEnabled} onChange={(v) => setBusiness((b) => b && { ...b, whatsappEnabled: v })} />
          <AToggle label="Show Floating Chat Widget" checked={business.whatsappFloatingButtonEnabled} onChange={(v) => setBusiness((b) => b && { ...b, whatsappFloatingButtonEnabled: v })} />
          <AToggle label="Show Product Page CTA" checked={business.whatsappProductButtonEnabled} onChange={(v) => setBusiness((b) => b && { ...b, whatsappProductButtonEnabled: v })} />
          <AToggle label="Enable Enquiry List Cart" checked={business.whatsappEnquiryListEnabled} onChange={(v) => setBusiness((b) => b && { ...b, whatsappEnquiryListEnabled: v })} />
        </div>

        {canEdit && (
          <button type="submit" disabled={savingBusiness} className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep disabled:opacity-60">
            {savingBusiness ? "Saving…" : "Save WhatsApp Settings"}
          </button>
        )}
      </form>

      {/* Column 3: Live Preview & System Integrations */}
      <div className="space-y-6">
        {/* WhatsApp Message Live Preview */}
        <div className="rounded-2xl border border-white/8 bg-[#141413] p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white/80">Message Preview</h3>
            <p className="text-xs text-white/40 mb-3">Live mockup of the generated WhatsApp text.</p>
          </div>

          <div className="rounded-2xl bg-[#0b141a] p-4 text-[13px] text-white/90 font-sans shadow-inner border border-[#128c7e]/20 max-h-64 overflow-y-auto space-y-2">
            {/* WhatsApp Chat Bubble Mockup */}
            <div className="bg-[#056162] text-white rounded-2xl rounded-tr-none px-3.5 py-2.5 max-w-[85%] ml-auto shadow-sm">
              <p className="font-semibold text-[10px] text-emerald-300 mb-1">
                {business.whatsappDisplayName || "Prestige Tiles Support"}
              </p>
              <div className="whitespace-pre-line leading-relaxed">
                {business.whatsappGreeting || "Hello Prestige Tiles,"}
                {"\n\n"}
                {business.whatsappDefaultMessage || "I am interested in the following product:"}
                {"\n\n"}
                <span className="opacity-60">
                  Product: Calacatta Gold Slab{"\n"}
                  SKU: PT-CAL-901{"\n"}
                  Size: 800 × 1600 mm{"\n"}
                  Finish: Polished{"\n"}
                  Quantity: 25 Boxes{"\n"}
                  Product Link: https://prestigetiles.in/products/calacatta-gold
                </span>
              </div>
              <p className="text-[9px] text-white/40 text-right mt-1.5 font-mono">11:18 AM ✓✓</p>
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <form onSubmit={handleThemeSubmit} className="space-y-4 rounded-2xl border border-white/8 bg-[#141413] p-6">
          <p className="text-sm font-medium text-white/70">Theme & Brand Color</p>
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

        {/* Integrations Configuration */}
        <div className="space-y-3 rounded-2xl border border-white/8 bg-[#141413] p-6">
          <p className="text-sm font-medium text-white/70">Integrations Status</p>
          <p className="text-xs text-white/35">
            Credentials configured securely via server environment variables.
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
