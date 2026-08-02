"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Send, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName?: string;
}

export function QuoteModal({ isOpen, onClose, productName }: QuoteModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    projectType: "Residential Villa",
    requirement: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          city: formData.city,
          type: "quote",
          notes: `[Quote Request for: ${productName || "Multiple Items"}] Project: ${
            formData.projectType
          }. Details: ${formData.requirement}`,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        toast.success("Quote request received! Our luxury consultant will call you shortly.");
      } else {
        toast.error("Unable to send request. Please check phone number.");
      }
    } catch {
      toast.error("Network error. Please try again or WhatsApp us directly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-ink/70 backdrop-blur-xs"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white p-6 md:p-8 shadow-2xl border border-stone-200"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-stone-400 hover:text-ink transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          {submitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-ink">Request Submitted</h3>
              <p className="text-sm text-slate-warm max-w-xs mx-auto">
                Thank you, {formData.name}. Our architectural design specialist will analyze your
                specifications and call you back within 2 business hours.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  onClose();
                }}
                className="mt-4 rounded-xl bg-ink px-8 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-accent hover:text-ink transition-colors"
              >
                Close Window
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                  Direct Factory Enquiry
                </span>
                <h3 className="text-2xl font-bold text-ink">
                  {productName ? `Quote for ${productName}` : "Request Project Quotation"}
                </h3>
                <p className="text-xs text-slate-warm mt-1">
                  Get architect pricing, sample swatches, and logistics delivery estimates.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ar. Vikram Hegde"
                    className="w-full rounded-xl border border-stone-200 bg-offwhite px-4 py-2.5 text-sm font-medium text-ink focus:border-accent focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      Phone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-stone-200 bg-offwhite px-4 py-2.5 text-sm font-medium text-ink focus:border-accent focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">City / Location</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Mangaluru / Bengaluru"
                      className="w-full rounded-xl border border-stone-200 bg-offwhite px-4 py-2.5 text-sm font-medium text-ink focus:border-accent focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Project Type</label>
                  <select
                    value={formData.projectType}
                    onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                    className="w-full rounded-xl border border-stone-200 bg-offwhite px-4 py-2.5 text-sm font-medium text-ink focus:border-accent focus:bg-white focus:outline-none"
                  >
                    <option value="Residential Villa">Residential Villa / Apartment</option>
                    <option value="Commercial Space">Commercial Complex / Office</option>
                    <option value="Hotel Resort">Hotel / Resort / Spa</option>
                    <option value="Architectural Project">Architect / Interior Designer Spec</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Requirement Notes / Approx Sq.Ft
                  </label>
                  <textarea
                    rows={3}
                    value={formData.requirement}
                    onChange={(e) => setFormData({ ...formData, requirement: e.target.value })}
                    placeholder="Specify estimated area (sq.ft), desired delivery timeline, or sample requests..."
                    className="w-full rounded-xl border border-stone-200 bg-offwhite px-4 py-2.5 text-sm font-medium text-ink focus:border-accent focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs text-stone-400">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  Your information is kept 100% confidential. No spam calls.
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-sm font-bold uppercase tracking-wider text-ink hover:bg-accent-hover transition-colors shadow-yellow disabled:opacity-50"
                >
                  {loading ? "Sending Request..." : "Submit Quotation Request"}{" "}
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
