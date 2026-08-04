"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Building2, Download, PhoneCall, ArrowRight } from "lucide-react";


export function CtaSection() {
  return (
    <section className="bg-white text-ink py-24 md:py-32 relative overflow-hidden">
      <Container size="wide" className="relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-eyebrow text-accent block mb-3 font-bold">Partner With Prestige</span>
          <h2 className="text-heading text-ink">Elevate Your Next Architectural Project</h2>
          <p className="text-body-lg text-slate-warm mt-3">
            Whether you are expanding your retail dealership or specifying slabs for a landmark skyscraper, our technical sales team is ready.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Become Dealer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl border border-stone-200/60 bg-offwhite p-8 flex flex-col justify-between hover:border-accent/40 hover:bg-white transition-all duration-500 group shadow-soft hover:shadow-float relative overflow-hidden"
          >
            <div>
              <div className="mb-5 flex h-12 w-12 items-center justify-center text-accent group-hover:scale-110 transition-transform duration-500">
                <Building2 className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold text-ink mb-2">Become a Dealer</h3>
              <p className="text-sm text-slate-warm leading-relaxed mb-8">
                Join our regional B2B retail network. Enjoy exclusive territorial protection, margin structures, and direct depot allocation.
              </p>
            </div>
            <Link
              href="/become-dealer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-ink hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-yellow"
            >
              Apply For Dealership <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          {/* Card 2: Download Catalogue */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="rounded-2xl border border-stone-200/60 bg-offwhite p-8 flex flex-col justify-between hover:border-accent/40 hover:bg-white transition-all duration-500 group shadow-soft hover:shadow-float relative overflow-hidden"
          >
            <div>
              <div className="mb-5 flex h-12 w-12 items-center justify-center text-accent group-hover:scale-110 transition-transform duration-500">
                <Download className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold text-ink mb-2">Download Master Catalogue</h3>
              <p className="text-sm text-slate-warm leading-relaxed mb-8">
                Access high-resolution digital lookbooks, technical CAD spec sheets, and installation packing details.
              </p>
            </div>
            <Link
              href="/catalogue"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-accent hover:text-ink hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-soft"
            >
              Download PDF Catalogue <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          {/* Card 3: Contact Sales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="rounded-2xl border border-stone-200/60 bg-offwhite p-8 flex flex-col justify-between hover:border-accent/40 hover:bg-white transition-all duration-500 group shadow-soft hover:shadow-float relative overflow-hidden"
          >
            <div>
              <div className="mb-5 flex h-12 w-12 items-center justify-center text-accent group-hover:scale-110 transition-transform duration-500">
                <PhoneCall className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold text-ink mb-2">Contact Technical Sales</h3>
              <p className="text-sm text-slate-warm leading-relaxed mb-8">
                Need custom sample swatches, instant project quotations, or technical advice for structural slab laying?
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-accent hover:text-ink hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-soft"
            >
              Speak With Specialist <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
