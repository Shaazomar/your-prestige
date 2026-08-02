"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { applicationsData } from "@/lib/applications";

export function ApplicationsSection() {
  return (
    <section className="bg-offwhite py-24 md:py-32 border-t border-stone-200">
      <Container size="wide">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <SectionHeading
            eyebrow="Architectural Taxonomy"
            title="Engineered for Every Environment"
            description="From ultra-luxury residential penthouses to heavy-duty commercial airports, explore surfaces classified by architectural application."
          />
          <Link
            href="/applications"
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-accent hover:text-ink transition-colors shadow-soft"
          >
            All 10 Applications <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {applicationsData.map((app, i) => (
            <motion.div
              key={app.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.6 }}
            >
              <Link
                href={`/applications/${app.slug}`}
                className="group relative block h-[420px] overflow-hidden rounded-2xl bg-white border border-stone-200 shadow-soft hover:shadow-float transition-all duration-500"
              >
                <Image
                  src={app.image}
                  alt={app.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                
                <div className="absolute top-4 left-4">
                  <span className="rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent backdrop-blur-md border border-white/10">
                    {app.count}
                  </span>
                </div>

                <div className="absolute bottom-6 inset-x-6 text-white">
                  <h3 className="text-2xl font-bold mb-1 flex items-center justify-between group-hover:text-accent transition-colors">
                    {app.title}
                    <ArrowUpRight className="h-5 w-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-accent" />
                  </h3>
                  <p className="text-xs text-stone-300 leading-relaxed font-normal">
                    {app.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
