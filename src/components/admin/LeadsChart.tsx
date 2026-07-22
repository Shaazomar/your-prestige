"use client";

import { useState } from "react";

interface DayPoint {
  label: string; // e.g. "12 Jul"
  count: number;
}

/**
 * Leads over the last 14 days — single-series bar chart.
 * One hue (gold), labeled axis carries identity; hover tooltip per bar.
 */
export function LeadsChart({ data }: { data: DayPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div>
      <div className="relative flex h-44 items-end gap-[6px]">
        {/* Recessive gridlines */}
        {[0.25, 0.5, 0.75].map((t) => (
          <div
            key={t}
            className="pointer-events-none absolute inset-x-0 border-t border-white/6"
            style={{ bottom: `${t * 100}%` }}
            aria-hidden
          />
        ))}
        {data.map((d, i) => (
          <div
            key={d.label}
            className="group relative flex h-full flex-1 items-end"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            {/* Tooltip */}
            {hover === i && (
              <div className="absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-white/10 bg-[#1d1d1b] px-3 py-1.5 text-xs shadow-float">
                <span className="font-semibold text-white">{d.count}</span>
                <span className="text-white/50"> lead{d.count === 1 ? "" : "s"} · {d.label}</span>
              </div>
            )}
            <div
              className="w-full rounded-t-[4px] bg-gold transition-all duration-300 group-hover:bg-gold-light"
              style={{
                height: `${Math.max(3, (d.count / max) * 100)}%`,
                opacity: d.count === 0 ? 0.18 : 1,
              }}
            />
          </div>
        ))}
      </div>
      {/* X axis — sparse labels */}
      <div className="mt-3 flex justify-between text-[0.65rem] text-white/30">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}
