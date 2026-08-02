"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Building, Compass, PenTool, Home } from "lucide-react";

const clientCategories = [
  {
    title: "Architectural Firms",
    icon: Compass,
    description: "Specifying book-matched slabs and custom facade cladding for luxury residences.",
    partners: ["Studio Morphosis", "Urban Matrix Architects", "Coastal Design Lab", "SpaceCraft Studio"],
  },
  {
    title: "Premier Builders",
    icon: Building,
    description: "Equipping high-rise residential complexes with certified slip-resistant vitrified tiles.",
    partners: ["Prestige Group Infra", "Coastal Habitat Builders", "Skyline Developers", "Lotus Construction"],
  },
  {
    title: "Interior Designers",
    icon: PenTool,
    description: "Creating turnkey residential sanctuaries with spa-grade wellness sanitaryware.",
    partners: ["Atelier Luxe Interiors", "Vogue Living Spaces", "Aura Design Co.", "Minimalist Living"],
  },
  {
    title: "Commercial Contractors",
    icon: Home,
    description: "Executing large-scale airport, mall, and hospital tile installations across South India.",
    partners: ["Apex Commercial Infra", "Metro Buildcorp", "Beacon Contracting", "Zenith Projects"],
  },
];

export function ClientsSection() {
  return (
    <section className="bg-offwhite py-24 md:py-32 border-t border-stone-200">
      <Container size="wide">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-eyebrow text-accent block mb-3 font-bold">Trusted Partner Network</span>
          <h2 className="text-heading text-ink">Choice of Industry Leaders</h2>
          <p className="text-body-lg text-slate-warm mt-3">
            Collaborating with leading architects, builders, interior studios, and infrastructure contractors across South India.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {clientCategories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <motion.div
                key={cat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="rounded-2xl bg-white border border-stone-200 p-6 shadow-soft hover:border-accent transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-ink">
                    <Icon className="h-5 w-5 text-ink" />
                  </div>
                  <h3 className="text-lg font-bold text-ink">{cat.title}</h3>
                </div>
                <p className="text-xs text-slate-warm leading-relaxed mb-6">{cat.description}</p>

                <div className="border-t border-stone-100 pt-4 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-accent">
                    Featured Collaborators
                  </p>
                  {cat.partners.map((partner) => (
                    <div
                      key={partner}
                      className="text-xs font-semibold text-ink bg-offwhite rounded-lg px-3 py-2 border border-stone-200/60"
                    >
                      {partner}
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
