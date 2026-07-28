"use client";

import { useMemo, useState } from "react";
import { LocateFixed, Loader2, Check } from "lucide-react";
import { ShowroomCard } from "./ShowroomCard";
import { distanceKm, type ShowroomView } from "@/lib/showrooms";
import { cn } from "@/lib/utils";

type GeoState = "idle" | "locating" | "granted" | "denied" | "unsupported";

/**
 * Showroom grid with opt-in "find my nearest" ranking.
 * Geolocation is never requested automatically — the visitor taps to share
 * location, and we only reorder client-side (no coordinates are transmitted).
 */
export function ShowroomsExplorer({ showrooms }: { showrooms: ShowroomView[] }) {
  const [geo, setGeo] = useState<GeoState>("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [cityFilter, setCityFilter] = useState<string>("All");

  const cities = useMemo(
    () => ["All", ...Array.from(new Set(showrooms.map((s) => s.city)))],
    [showrooms]
  );

  function locate() {
    if (!("geolocation" in navigator)) return setGeo("unsupported");
    setGeo("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeo("granted");
      },
      () => setGeo("denied"),
      { timeout: 10_000, maximumAge: 300_000 }
    );
  }

  const ranked = useMemo(() => {
    const filtered =
      cityFilter === "All" ? showrooms : showrooms.filter((s) => s.city === cityFilter);

    if (!coords) return filtered.map((s) => ({ s, d: null as number | null }));

    return filtered
      .map((s) => ({
        s,
        d:
          s.latitude != null && s.longitude != null
            ? distanceKm(coords, { lat: s.latitude, lng: s.longitude })
            : null,
      }))
      .sort((a, b) => {
        if (a.d == null) return 1;
        if (b.d == null) return -1;
        return a.d - b.d;
      });
  }, [showrooms, coords, cityFilter]);

  const nearestId = coords && ranked[0]?.d != null ? ranked[0].s.id : null;

  return (
    <div>
      {/* Controls */}
      <div className="mb-10 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {cities.map((c) => (
            <button
              key={c}
              onClick={() => setCityFilter(c)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300",
                cityFilter === c
                  ? "border-ink bg-ink text-ivory"
                  : "border-ink/12 text-slate-warm hover:border-ink/30 hover:text-ink"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <button
          onClick={locate}
          disabled={geo === "locating" || geo === "granted"}
          className={cn(
            "ml-auto flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300",
            geo === "granted"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
              : "border-gold/40 text-gold-deep hover:bg-gold hover:text-ivory"
          )}
        >
          {geo === "locating" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Locating…
            </>
          ) : geo === "granted" ? (
            <>
              <Check className="h-4 w-4" />
              Sorted by distance
            </>
          ) : (
            <>
              <LocateFixed className="h-4 w-4" />
              Find nearest to me
            </>
          )}
        </button>
      </div>

      {(geo === "denied" || geo === "unsupported") && (
        <p className="mb-8 rounded-2xl border hairline bg-porcelain px-5 py-3.5 text-sm text-slate-warm">
          {geo === "denied"
            ? "No problem — location access was declined. All showrooms are listed below with directions."
            : "Your browser doesn't support location. All showrooms are listed below with directions."}
        </p>
      )}

      {/* Grid */}
      <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
        {ranked.map(({ s, d }, i) => (
          <ShowroomCard
            key={s.id}
            showroom={s}
            distanceKm={d}
            isNearest={s.id === nearestId}
            priority={i < 3}
          />
        ))}
      </div>

      {ranked.length === 0 && (
        <p className="rounded-3xl border border-dashed hairline py-20 text-center text-slate-warm">
          No showrooms in {cityFilter}.
        </p>
      )}
    </div>
  );
}
