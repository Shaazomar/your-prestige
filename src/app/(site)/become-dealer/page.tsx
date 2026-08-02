"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/site/PageHero";
import { ShieldCheck, Award, Truck, Send, CheckCircle2, Layers } from "lucide-react";
import { toast } from "sonner";


export default function BecomeDealerPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    contactPerson: "",
    phone: "",
    email: "",
    city: "",
    state: "Karnataka",
    gstin: "",
    currentBrands: "",
    showroomAreaSqFt: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${formData.contactPerson} (${formData.businessName})`,
          phone: formData.phone,
          email: formData.email,
          city: `${formData.city}, ${formData.state}`,
          type: "dealer_enquiry",
          notes: `[DEALER ENQUIRY] GSTIN: ${formData.gstin}. Showroom Area: ${formData.showroomAreaSqFt} sq.ft. Brands: ${formData.currentBrands}. Note: ${formData.message}`,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        toast.success("Dealer application submitted! Our regional franchise head will connect with you.");
      } else {
        toast.error("Submission error. Please verify phone number.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <PageHero
        eyebrow="B2B Retail Partner Network"
        title="Become an Authorised Prestige Dealer"
        description="Partner with coastal Karnataka's premier luxury tile and sanitaryware brand. Expand your retail enterprise with exclusive territorial rights, direct depot logistics, and high-margin product lines."
      />

      {/* Benefits grid */}
      <section className="py-16 md:py-24 border-b border-stone-200">
        <Container size="wide">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-eyebrow text-accent block mb-2 font-bold">Why Partner With Us</span>
            <h2 className="text-heading text-ink">Authorised Dealer Advantages</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="rounded-2xl border border-stone-200 bg-offwhite p-8 shadow-soft">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-ink">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-ink mb-2">Territorial Protection</h3>
              <p className="text-xs text-slate-warm leading-relaxed">
                Exclusive geographic dealership allocation in your city/pincode to protect retail margins.
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-offwhite p-8 shadow-soft">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-ink">
                <Truck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-ink mb-2">Direct Depot Logistics</h3>
              <p className="text-xs text-slate-warm leading-relaxed">
                24-48 hour stock dispatch from our central regional depots to eliminate local warehousing burdens.
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-offwhite p-8 shadow-soft">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-ink">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-ink mb-2">Display & Stand Support</h3>
              <p className="text-xs text-slate-warm leading-relaxed">
                Complimentary architectural display stands, tile sample boxes, and illuminated showroom branding.
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-offwhite p-8 shadow-soft">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-ink">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-ink mb-2">Future B2B Portal Access</h3>
              <p className="text-xs text-slate-warm leading-relaxed">
                Phase 2 portal access for live stock reservations, credit limit tracking, and instant B2B ordering.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Dealer Application Form */}
      <section className="py-20 md:py-28 bg-offwhite">
        <Container size="wide">
          <div className="max-w-3xl mx-auto rounded-3xl bg-white p-8 md:p-12 shadow-float border border-stone-200">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="text-3xl font-bold text-ink">Application Submitted</h3>
                <p className="text-sm text-slate-warm max-w-md mx-auto">
                  Thank you, {formData.contactPerson}. Our B2B Franchise Onboarding desk will review your details and contact you within 24 hours.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-8 text-center">
                  <span className="text-eyebrow text-accent block mb-2 font-bold">Official Application</span>
                  <h2 className="text-heading text-ink">Dealership Onboarding Form</h2>
                  <p className="text-sm text-slate-warm mt-1">
                    Fill out your firm&apos;s details below for priority review by our regional channel head.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Firm / Business Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        placeholder="e.g. Royal Ceramics & Bath"
                        className="w-full rounded-xl border border-stone-200 bg-offwhite px-4 py-3 text-sm font-medium text-ink focus:border-accent focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Contact Person Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        placeholder="e.g. Rajesh Kumar"
                        className="w-full rounded-xl border border-stone-200 bg-offwhite px-4 py-3 text-sm font-medium text-ink focus:border-accent focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Phone / Mobile *</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full rounded-xl border border-stone-200 bg-offwhite px-4 py-3 text-sm font-medium text-ink focus:border-accent focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="rajesh@firm.com"
                        className="w-full rounded-xl border border-stone-200 bg-offwhite px-4 py-3 text-sm font-medium text-ink focus:border-accent focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">City / Town *</label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="e.g. Udupi"
                        className="w-full rounded-xl border border-stone-200 bg-offwhite px-4 py-3 text-sm font-medium text-ink focus:border-accent focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">State *</label>
                      <select
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full rounded-xl border border-stone-200 bg-offwhite px-4 py-3 text-sm font-medium text-ink focus:border-accent focus:bg-white focus:outline-none"
                      >
                        <option value="Karnataka">Karnataka</option>
                        <option value="Kerala">Kerala</option>
                        <option value="Goa">Goa</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Maharashtra">Maharashtra</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Showroom Area (Sq.Ft)</label>
                      <input
                        type="text"
                        value={formData.showroomAreaSqFt}
                        onChange={(e) => setFormData({ ...formData, showroomAreaSqFt: e.target.value })}
                        placeholder="e.g. 2500 sq.ft"
                        className="w-full rounded-xl border border-stone-200 bg-offwhite px-4 py-3 text-sm font-medium text-ink focus:border-accent focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">GSTIN Number (Optional)</label>
                      <input
                        type="text"
                        value={formData.gstin}
                        onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                        placeholder="29AAAAA0000A1Z5"
                        className="w-full rounded-xl border border-stone-200 bg-offwhite px-4 py-3 text-sm font-medium text-ink focus:border-accent focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Currently Retailing Brands</label>
                      <input
                        type="text"
                        value={formData.currentBrands}
                        onChange={(e) => setFormData({ ...formData, currentBrands: e.target.value })}
                        placeholder="e.g. Somany, Kajaria, Kohler"
                        className="w-full rounded-xl border border-stone-200 bg-offwhite px-4 py-3 text-sm font-medium text-ink focus:border-accent focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">Additional Notes</label>
                    <textarea
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Share details regarding your existing retail footprint or project network..."
                      className="w-full rounded-xl border border-stone-200 bg-offwhite px-4 py-3 text-sm font-medium text-ink focus:border-accent focus:bg-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent py-4 text-xs font-bold uppercase tracking-wider text-ink hover:bg-accent-hover transition-colors shadow-yellow disabled:opacity-50"
                  >
                    {loading ? "Submitting Application..." : "Submit Dealership Application"}{" "}
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </>
            )}
          </div>
        </Container>
      </section>
    </main>
  );
}
