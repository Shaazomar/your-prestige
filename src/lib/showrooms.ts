import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { Showroom } from "@prisma/client";

/** Plain, serialisable showroom shape safe to pass into client components. */
export interface ShowroomView {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  addressLine: string;
  locality: string | null;
  city: string;
  state: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  mapUrl: string | null;
  mapEmbedUrl: string | null;
  directions: string | null;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  managerName: string | null;
  managerPhone: string | null;
  hoursWeekdays: string;
  hoursSunday: string;
  heroImage: string | null;
  gallery: string[];
  video: string | null;
  description: string | null;
  brands: string[];
  amenities: string[];
  featuredProductIds: string[];
  isFlagship: boolean;
  // Google Business Profile, maintained by hand — see the Showroom model.
  googlePlaceId: string | null;
  googleReviewUrl: string | null;
  googleWriteReviewUrl: string | null;
  googleRating: number | null;
  googleReviewCount: number;
  googlePhotos: string[];
}

const arr = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);

export function toShowroomView(s: Showroom): ShowroomView {
  return {
    id: s.id,
    slug: s.slug,
    name: s.name,
    subtitle: s.subtitle,
    addressLine: s.addressLine,
    locality: s.locality,
    city: s.city,
    state: s.state,
    postalCode: s.postalCode,
    latitude: s.latitude,
    longitude: s.longitude,
    mapUrl: s.mapUrl,
    mapEmbedUrl: s.mapEmbedUrl,
    directions: s.directions,
    phone: s.phone,
    whatsapp: s.whatsapp,
    email: s.email,
    managerName: s.managerName,
    managerPhone: s.managerPhone,
    hoursWeekdays: s.hoursWeekdays,
    hoursSunday: s.hoursSunday,
    heroImage: s.heroImage,
    gallery: arr(s.gallery),
    video: s.video,
    description: s.description,
    brands: arr(s.brands),
    amenities: arr(s.amenities),
    featuredProductIds: arr(s.featuredProductIds),
    isFlagship: s.isFlagship,
    googlePlaceId: s.googlePlaceId,
    googleReviewUrl: s.googleReviewUrl,
    googleWriteReviewUrl: s.googleWriteReviewUrl,
    googleRating: s.googleRating,
    googleReviewCount: s.googleReviewCount,
    googlePhotos: arr(s.googlePhotos),
  };
}

/** All published showrooms, flagship first then by sort order. */
export const getShowrooms = cache(async (): Promise<ShowroomView[]> => {
  try {
    const rows = await prisma.showroom.findMany({
      where: { published: true, deletedAt: null },
      orderBy: [{ isFlagship: "desc" }, { sortOrder: "asc" }],
    });
    return rows.map(toShowroomView);
  } catch {
    return [];
  }
});

export const getShowroomBySlug = cache(async (slug: string): Promise<ShowroomView | null> => {
  try {
    const row = await prisma.showroom.findFirst({
      where: { slug, published: true, deletedAt: null },
    });
    return row ? toShowroomView(row) : null;
  } catch {
    return null;
  }
});

/** Compact single-line address for cards and schema. */
export function formatAddress(s: ShowroomView) {
  return [s.addressLine, s.locality, s.city, s.postalCode].filter(Boolean).join(", ");
}

/** Directions link — prefers the curated Maps URL, else a coordinate/address query. */
export function directionsHref(s: ShowroomView) {
  if (s.mapUrl) return s.mapUrl;
  const q =
    s.latitude != null && s.longitude != null
      ? `${s.latitude},${s.longitude}`
      : formatAddress(s);
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
}

/** Great-circle distance in km — used for nearest-showroom ranking. */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
