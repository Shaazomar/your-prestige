"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPin, Phone, Navigation, ArrowUpRight, Clock, Store, Star, CalendarCheck2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type ShowroomView, formatAddress, directionsHref } from "@/lib/showrooms";
import { telHref, waHref } from "@/lib/business";

interface ShowroomCardProps {
  showroom: ShowroomView;
  /** Distance in km from the visitor, when geolocation was granted */
  distanceKm?: number | null;
  /** Marks the closest branch */
  isNearest?: boolean;
  priority?: boolean;
}

/**
 * Glass-overlay showroom card — large photography, hover lift, and the four
 * actions that matter: Directions, Call, WhatsApp, Book Visit.
 */
export function ShowroomCard({ showroom: s, distanceKm, isNearest, priority }: ShowroomCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-[28px] border border-ink/8 bg-white shadow-soft transition-all duration-700 hover:-translate-y-1.5 hover:shadow-float"
    >
      {/* Photography */}
      <Link href={`/showrooms/${s.slug}`} className="relative block aspect-[16/11] overflow-hidden">
        {s.heroImage ? (
          <Image
            src={s.heroImage}
            alt={`${s.name} showroom interior`}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-107"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-stone-100 text-stone-300">
            <Store className="h-10 w-10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />

        {/* Badges */}
        <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {isNearest && (
              <span className="glass-dark rounded-full px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-gold">
                Nearest to you
              </span>
            )}
            {s.isFlagship && !isNearest && (
              <span className="glass-dark flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-gold">
                <Star className="h-3 w-3 fill-gold" />
                Flagship
              </span>
            )}
          </div>
          {distanceKm != null && (
            <span className="glass-dark shrink-0 rounded-full px-3 py-1.5 text-[0.68rem] font-medium text-ivory">
              {distanceKm < 1 ? "<1 km" : `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km`}
            </span>
          )}
        </div>

        {/* Name over image */}
        <div className="absolute inset-x-0 bottom-0 p-6">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-gold">
            {s.locality ?? s.city}
          </p>
          <h3 className="mt-1.5 text-2xl font-semibold leading-tight tracking-tight text-ivory">
            {s.name}
          </h3>
          {s.subtitle && <p className="mt-1 text-sm text-ivory/65">{s.subtitle}</p>}
        </div>
      </Link>

      {/* Body */}
      <div className="space-y-4 p-6">
        <p className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-warm">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          {formatAddress(s)}
        </p>
        <p className="flex items-start gap-2.5 text-sm text-slate-warm">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <span>
            {s.hoursWeekdays}
            <br />
            <span className={cn(/closed/i.test(s.hoursSunday) && "text-stone-400")}>
              {s.hoursSunday}
            </span>
          </span>
        </p>

        {s.brands.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {s.brands.slice(0, 4).map((b) => (
              <span
                key={b}
                className="rounded-full border border-ink/10 px-2.5 py-1 text-[0.68rem] font-medium text-slate-warm"
              >
                {b}
              </span>
            ))}
            {s.brands.length > 4 && (
              <span className="rounded-full border border-dashed border-stone-300 px-2.5 py-1 text-[0.68rem] text-stone-400">
                +{s.brands.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 border-t hairline pt-4">
          <a
            href={directionsHref(s)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-ivory transition-colors hover:bg-graphite"
          >
            <Navigation className="h-3.5 w-3.5" />
            Directions
          </a>
          <a
            href={telHref(s.phone)}
            aria-label={`Call ${s.name}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/12 text-ink transition-colors hover:border-ink hover:bg-ink hover:text-ivory"
          >
            <Phone className="h-3.5 w-3.5" />
          </a>
          {s.whatsapp && (
            <a
              href={waHref(s.whatsapp, `Hi! I'd like to enquire about the ${s.locality ?? s.city} showroom.`)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`WhatsApp ${s.name}`}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/12 text-ink transition-colors hover:border-[#25D366] hover:text-[#25D366]"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
          )}
          <Link
            href={`/book-visit?showroom=${s.slug}`}
            className="flex items-center gap-1.5 rounded-full border border-gold/40 px-4 py-2 text-xs font-semibold text-gold-deep transition-colors hover:bg-gold hover:text-ivory"
          >
            <CalendarCheck2 className="h-3.5 w-3.5" />
            Book Visit
          </Link>
          <Link
            href={`/showrooms/${s.slug}`}
            className="ml-auto flex items-center gap-1 text-xs font-medium text-ink transition-colors hover:text-gold"
          >
            Explore
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
