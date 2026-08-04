"use client";

import { motion } from "framer-motion";
import { Award, Briefcase, Building2, Globe2, Layers } from "lucide-react";
import { Container } from "@/components/ui/Container";

const stats = [
  { icon: Award, value: "25+", label: "Years of Excellence" },
  { icon: Briefcase, value: "1500+", label: "Projects Completed" },
  { icon: Building2, value: "1200+", label: "Dealer Network" },
  { icon: Globe2, value: "25+", label: "Countries Served" },
  { icon: Layers, value: "10M+", label: "Sq.ft Tiles Delivered" },
];

export function StatsSection() {
  return (
    <section className="bg-white py-12">
      <Container size="wide">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-[2.25rem] bg-white text-ink p-8 sm:p-12 shadow-soft border border-stone-200/80 relative overflow-hidden"
        >
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-5 gap-8 divide-y md:divide-y-0 md:divide-x divide-stone-200/40">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={`flex flex-col items-center text-center group cursor-default ${i !== 0 ? "pt-6 md:pt-0 md:pl-6" : ""}`}
              >
                <div className="flex h-12 w-12 items-center justify-center text-accent mb-4 transition-all duration-500 group-hover:scale-110">
                  <stat.icon className="h-6 w-6" />
                </div>
                <p className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-1 transition-all duration-500 group-hover:scale-105 group-hover:text-accent">
                  {stat.value}
                </p>
                <p className="text-xs text-slate-warm font-medium max-w-[140px] transition-colors duration-300 group-hover:text-ink">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
