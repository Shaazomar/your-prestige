"use client";

import { useState } from "react";
import { saveBusinessSettings, type BusinessSettings } from "@/app/admin/(dashboard)/settings/actions";
import { MessageSquare, Phone, BarChart2, Eye, Sliders, CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";
import { generateSingleProductWhatsAppMessage, generateMultiProductWhatsAppMessage } from "@/lib/whatsapp";

interface AnalyticsData {
  totalClicks: number;
  totalEnquiries: number;
  conversionRate: string;
  topProducts: { name: string; sku: string; count: number }[];
  recentEvents: { id: string; eventType: string; productName: string | null; quantity: string | null; createdAt: Date }[];
}

interface Props {
  initialSettings: BusinessSettings;
  analytics: AnalyticsData;
}

export function WhatsAppManager({ initialSettings, analytics }: Props) {
  const [activeTab, setActiveTab] = useState<"settings" | "numbers" | "preview" | "analytics">("settings");
  const [settings, setSettings] = useState<BusinessSettings>(initialSettings);
  const [saving, setSaving] = useState(false);

  // Preview State
  const [previewType, setPreviewType] = useState<"single" | "multi">("single");
  const sampleSingle = generateSingleProductWhatsAppMessage({
    productName: "Calacatta White Marble Slab",
    sku: "PT-CAL-001",
    size: "600 × 1200 mm",
    finish: "Matt",
    quantity: "50",
    unit: "Boxes",
    price: 3450,
    productUrl: "https://yourprestige.in/products/tiles/calacatta-white",
  });

  const sampleMulti = generateMultiProductWhatsAppMessage([
    { id: "1", name: "Calacatta White", sku: "PT001", size: "600x1200 mm", finish: "Matt", quantity: 20, unit: "Boxes" },
    { id: "2", name: "Royal Grey Marble", sku: "PT002", size: "800x1600 mm", finish: "Glossy", quantity: 15, unit: "Boxes" },
    { id: "3", name: "Stone Beige", sku: "PT003", size: "600x600 mm", finish: "Carving", quantity: 30, unit: "Boxes" },
  ]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveBusinessSettings(settings);
      toast.success("WhatsApp Commerce settings saved successfully! Frontend updated.");
    } catch {
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-gold/20 bg-gradient-to-r from-[#1b251b] via-[#141814] to-[#141413] p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 shadow-inner">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">WhatsApp Commerce Engine</h1>
            <p className="text-xs text-white/50">
              Manage numbers, floating CTAs, multi-product enquiry lists, and live WhatsApp metrics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366]/10 border border-[#25D366]/30 px-3 py-1 text-xs font-semibold text-[#25D366]">
            <span className="h-2 w-2 rounded-full bg-[#25D366] animate-pulse" />
            {settings.whatsappEnabled ? "Engine Active" : "Disabled"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-2">
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "settings"
              ? "border-gold text-gold font-bold"
              : "border-transparent text-white/60 hover:text-white"
          }`}
        >
          <Sliders className="h-4 w-4" />
          Number & Toggles
        </button>

        <button
          onClick={() => setActiveTab("preview")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "preview"
              ? "border-gold text-gold font-bold"
              : "border-transparent text-white/60 hover:text-white"
          }`}
        >
          <Eye className="h-4 w-4" />
          Message Preview
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "analytics"
              ? "border-gold text-gold font-bold"
              : "border-transparent text-white/60 hover:text-white"
          }`}
        >
          <BarChart2 className="h-4 w-4" />
          WhatsApp Analytics
        </button>
      </div>

      {/* Tab 1: Settings Form */}
      {activeTab === "settings" && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Number Settings */}
            <div className="rounded-2xl border border-white/10 bg-[#141413] p-6 space-y-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Phone className="h-4 w-4 text-gold" />
                Primary WhatsApp Number
              </h2>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5">
                  WhatsApp Ordering Number
                </label>
                <input
                  type="text"
                  value={settings.whatsappNumber}
                  onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  placeholder="+919876543210"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white font-mono focus:border-gold outline-none"
                  required
                />
                <p className="mt-1 text-[11px] text-white/40">
                  Changing this number instantly updates all website WhatsApp CTAs across desktop and mobile.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={settings.whatsappDisplayName}
                  onChange={(e) => setSettings({ ...settings, whatsappDisplayName: e.target.value })}
                  placeholder="Prestige Tiles Sales Concierge"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5">
                  Business Hours
                </label>
                <input
                  type="text"
                  value={settings.whatsappBusinessHours}
                  onChange={(e) => setSettings({ ...settings, whatsappBusinessHours: e.target.value })}
                  placeholder="Mon-Sat: 9:00 AM - 7:30 PM"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-gold outline-none"
                />
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="rounded-2xl border border-white/10 bg-[#141413] p-6 space-y-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-gold" />
                Feature Activation Toggles
              </h2>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02] cursor-pointer">
                  <div>
                    <span className="text-sm font-semibold text-white block">Enable WhatsApp Commerce</span>
                    <span className="text-xs text-white/40">Master switch for all WhatsApp features</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.whatsappEnabled}
                    onChange={(e) => setSettings({ ...settings, whatsappEnabled: e.target.checked })}
                    className="h-5 w-5 accent-gold"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02] cursor-pointer">
                  <div>
                    <span className="text-sm font-semibold text-white block">Floating WhatsApp Button</span>
                    <span className="text-xs text-white/40">Desktop bottom-right & Mobile sticky CTA</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.whatsappFloatingButtonEnabled}
                    onChange={(e) => setSettings({ ...settings, whatsappFloatingButtonEnabled: e.target.checked })}
                    className="h-5 w-5 accent-gold"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02] cursor-pointer">
                  <div>
                    <span className="text-sm font-semibold text-white block">Product Page WhatsApp Buttons</span>
                    <span className="text-xs text-white/40">Order & Enquire on WhatsApp buttons on cards</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.whatsappProductButtonEnabled}
                    onChange={(e) => setSettings({ ...settings, whatsappProductButtonEnabled: e.target.checked })}
                    className="h-5 w-5 accent-gold"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02] cursor-pointer">
                  <div>
                    <span className="text-sm font-semibold text-white block">Multi-Product Enquiry List</span>
                    <span className="text-xs text-white/40">Lightweight WhatsApp enquiry cart</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.whatsappEnquiryListEnabled}
                    onChange={(e) => setSettings({ ...settings, whatsappEnquiryListEnabled: e.target.checked })}
                    className="h-5 w-5 accent-gold"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-bold text-black shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {saving ? "Saving Changes..." : "Save WhatsApp Settings"}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Live Message Preview */}
      {activeTab === "preview" && (
        <div className="rounded-2xl border border-white/10 bg-[#141413] p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Live WhatsApp Message Preview</h2>
              <p className="text-xs text-white/40">Verify how pre-filled WhatsApp messages look when generated by customers.</p>
            </div>

            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setPreviewType("single")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  previewType === "single" ? "bg-gold text-black" : "text-white/60 hover:text-white"
                }`}
              >
                Single Product
              </button>
              <button
                onClick={() => setPreviewType("multi")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  previewType === "multi" ? "bg-gold text-black" : "text-white/60 hover:text-white"
                }`}
              >
                Multi-Product Enquiry
              </button>
            </div>
          </div>

          {/* Chat Preview Window */}
          <div className="max-w-xl mx-auto rounded-2xl border border-white/10 bg-[#0b141a] overflow-hidden shadow-2xl">
            <div className="bg-[#202c33] px-4 py-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-[#25D366]/20 flex items-center justify-center text-[#25D366] font-bold text-sm">
                PT
              </div>
              <div>
                <p className="text-sm font-bold text-white">{settings.whatsappDisplayName || "Prestige Tiles Sales"}</p>
                <p className="text-[10px] text-[#00a884]">{settings.whatsappNumber || "+919876543210"}</p>
              </div>
            </div>

            <div className="p-6 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px]">
              <div className="ml-auto max-w-sm rounded-2xl bg-[#005c4b] p-4 text-xs font-mono text-white leading-relaxed shadow-md space-y-2 whitespace-pre-wrap">
                {previewType === "single" ? sampleSingle : sampleMulti}
              </div>
            </div>

            <div className="bg-[#202c33] px-4 py-3 flex justify-end">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(previewType === "single" ? sampleSingle : sampleMulti);
                  toast.success("Message template copied to clipboard!");
                }}
                className="flex items-center gap-1.5 text-xs text-gold hover:underline"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Analytics */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#141413] p-5">
              <p className="text-xs uppercase tracking-wider font-semibold text-white/40 mb-1">Total WhatsApp Clicks</p>
              <p className="text-2xl font-bold text-emerald-400">{analytics.totalClicks}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#141413] p-5">
              <p className="text-xs uppercase tracking-wider font-semibold text-white/40 mb-1">Enquiries Sent</p>
              <p className="text-2xl font-bold text-gold">{analytics.totalEnquiries}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#141413] p-5">
              <p className="text-xs uppercase tracking-wider font-semibold text-white/40 mb-1">Catalog Conversion Rate</p>
              <p className="text-2xl font-bold text-blue-400">{analytics.conversionRate}%</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Enquired Products */}
            <div className="rounded-2xl border border-white/10 bg-[#141413] p-6 space-y-4">
              <h3 className="font-semibold text-white">Most Enquired Products on WhatsApp</h3>
              <div className="space-y-2">
                {analytics.topProducts.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                    <div>
                      <p className="text-xs font-bold text-white">{p.name}</p>
                      <p className="text-[10px] text-white/40">{p.sku}</p>
                    </div>
                    <span className="text-xs font-mono font-semibold text-gold">{p.count} Enquiries</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent WhatsApp Events */}
            <div className="rounded-2xl border border-white/10 bg-[#141413] p-6 space-y-4">
              <h3 className="font-semibold text-white">Recent Website WhatsApp Events</h3>
              <div className="space-y-2">
                {analytics.recentEvents.map((ev) => (
                  <div key={ev.id} className="p-3 rounded-xl border border-white/5 bg-white/[0.02] space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-[#25D366]">{ev.eventType}</span>
                      <span className="text-[10px] text-white/30">
                        {new Date(ev.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-xs text-white/60 truncate">{ev.productName || "General Enquiry"}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
