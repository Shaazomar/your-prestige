"use client";

import { motion } from "framer-motion";
import { Counter } from "@/components/motion/Counter";
import { Container } from "@/components/ui/Container";
import { Award, Factory, Crown, Truck } from "lucide-react";


const stats = [
  { value: 18, suffix: "+", label: "Years of Craftsmanship", sub: "Established leadership in luxury surfaces" },
  { value: 2400, suffix: "+", label: "Architectural Projects", sub: "Villas, hotels & commercial towers" },
  { value: 120, suffix: "+", label: "Authorised Dealer Outlets", sub: "Rapid fulfillment network" },
  { value: 35, suffix: "+", label: "Cities Served", sub: "Karnataka, Kerala & Goa" },
  { value: 5, suffix: "", label: "States Covered", sub: "Direct depot logistics" },
];

const pillars = [
  {
    icon: Factory,
    title: "State-of-the-Art Infrastructure",
    description: "Equipped with Italian Sacmi press lines and 1200°C continuous kilns for zero-warpage slab precision.",
  },
  {
    icon: Award,
    title: "International Quality Standards",
    description: "ISO 9001 certified vitrification ensuring <0.05% water absorption and R11 slip resistance.",
  },
  {
    icon: Crown,
    title: "Exclusive Designer Curation",
    description: "Handpicked Italian marble, Spanish ceramic motifs, and custom metallic PVD bathware.",
  },
  {
    icon: Truck,
    title: "Direct Depot Logistics",
    description: "Centralized warehouse reserves preventing job site delays and shade mismatch.",
  },
];

export function WhyChooseUs() {
  return (
    <section className="bg-white py-24 md:py-32 relative overflow-hidden">
      <Container size="wide" className="relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-eyebrow text-accent block mb-3 font-bold">Uncompromising Quality</span>
          <h2 className="text-heading text-ink">Why Architects & Developers Choose Prestige</h2>
          <p className="text-body-lg text-slate-warm mt-3">
            Combining Italian surface technology, stringent quality assurance, and a reliable depot network.
          </p>
        </div>

        {/* Big Statistics Counter Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 rounded-2xl bg-offwhite p-8 md:p-12 border border-stone-200/80 shadow-soft mb-20">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="text-center p-4 border-r last:border-0 border-stone-200/50"
            >
              <div className="text-4xl md:text-5xl font-extrabold text-ink tracking-tight flex items-center justify-center gap-0.5">
                <Counter value={stat.value} />
                <span className="text-accent">{stat.suffix}</span>
              </div>
              <p className="text-sm font-bold text-ink mt-2">{stat.label}</p>
              <p className="text-xs text-slate-warm mt-1 hidden md:block">{stat.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Four Feature Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="rounded-2xl bg-offwhite border border-stone-200/60 p-8 shadow-soft hover:shadow-float hover:border-accent/40 hover:bg-white transition-all duration-500 group relative overflow-hidden"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center text-accent group-hover:scale-110 transition-transform duration-500">
                  <Icon className="h-7 w-7 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-ink mb-2 group-hover:text-accent transition-colors duration-300">{p.title}</h3>
                <p className="text-sm text-slate-warm leading-relaxed">{p.description}</p>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
