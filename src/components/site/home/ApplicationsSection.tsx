"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";

const roomApplications = [
  {
    slug: "living-room",
    title: "Living Room",
    subtitle: "Elegant & Timeless",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop",
  },
  {
    slug: "kitchen",
    title: "Kitchen",
    subtitle: "Stylish & Functional",
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=600&auto=format&fit=crop",
  },
  {
    slug: "bathroom",
    title: "Bathroom",
    subtitle: "Luxury & Comfort",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop",
  },
  {
    slug: "outdoor",
    title: "Outdoor",
    subtitle: "Durable & Beautiful",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=600&auto=format&fit=crop",
  },
  {
    slug: "commercial",
    title: "Commercial",
    subtitle: "Striking & Professional",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=600&auto=format&fit=crop",
  },
];

export function ApplicationsSection() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <Container size="wide">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink">
                Designed for Every Space
              </h2>
              <span className="h-[2px] w-8 bg-accent inline-block align-middle ml-2" />
            </div>
            <p className="text-xs text-slate-warm">Tailored porcelain surface solutions engineered for every architectural context.</p>
          </div>

          <Link
            href="/applications"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ink hover:text-accent transition-colors"
          >
            View all applications <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Applications Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {roomApplications.map((app, i) => (
            <motion.div
              key={app.slug}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.7 }}
            >
              <Link
                href={`/applications/${app.slug}`}
                className="group relative block aspect-[3/4] w-full overflow-hidden rounded-[1.75rem] shadow-soft hover:shadow-float transition-all duration-500"
              >
                <Image
                  src={app.image}
                  alt={app.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 20vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                {/* Content Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-5 flex items-end justify-between">
                  <div>
                    <h3 className="font-bold text-base text-white group-hover:text-accent transition-colors">
                      {app.title}
                    </h3>
                    <p className="text-[11px] text-stone-300 font-normal">
                      {app.subtitle}
                    </p>
                  </div>

                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md group-hover:bg-accent group-hover:text-ink transition-all duration-300">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
