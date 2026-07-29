"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * A small ordered list of product slugs kept in localStorage — the storage
 * behind both the wishlist and recently-viewed.
 *
 * Deliberately device-local. There is no public-facing account system on this
 * site (only admin auth), so there is nothing to key a server-side list to;
 * pretending otherwise would mean either forcing a sign-up flow the brief
 * never asked for, or silently losing the list. The wishlist page instead
 * offers to send the selection as a quotation request, which is the actual
 * business outcome and does persist — as a Lead.
 *
 * Writes are mirrored to other tabs via the `storage` event, and a custom
 * event covers same-tab updates, so a heart icon in the header stays in sync
 * with one clicked in the grid.
 */

const CHANGE_EVENT = "prestige:local-collection";

function read(key: string, max: number): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string").slice(0, max)
      : [];
  } catch {
    // Private browsing, quota, or hand-edited junk — behave as if empty.
    return [];
  }
}

function write(key: string, items: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { key } }));
  } catch {
    // Storage unavailable; the in-memory state still works for this session.
  }
}

export function useLocalCollection(key: string, max = 24) {
  // Always start empty so server and client markup agree; the effect below
  // fills it in after mount. Reading localStorage during render would
  // hydration-mismatch every time.
  const [items, setItems] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(read(key, max));
    setReady(true);

    const sync = (e: Event) => {
      if (e instanceof CustomEvent && e.detail?.key && e.detail.key !== key) return;
      setItems(read(key, max));
    };
    window.addEventListener("storage", sync);
    window.addEventListener(CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(CHANGE_EVENT, sync);
    };
  }, [key, max]);

  const add = useCallback(
    (slug: string) => {
      const next = [slug, ...read(key, max).filter((s) => s !== slug)].slice(0, max);
      write(key, next);
      setItems(next);
    },
    [key, max]
  );

  const remove = useCallback(
    (slug: string) => {
      const next = read(key, max).filter((s) => s !== slug);
      write(key, next);
      setItems(next);
    },
    [key, max]
  );

  const toggle = useCallback(
    (slug: string) => {
      const current = read(key, max);
      const next = current.includes(slug)
        ? current.filter((s) => s !== slug)
        : [slug, ...current].slice(0, max);
      write(key, next);
      setItems(next);
      return next.includes(slug);
    },
    [key, max]
  );

  const clear = useCallback(() => {
    write(key, []);
    setItems([]);
  }, [key]);

  return { items, ready, add, remove, toggle, clear, has: (s: string) => items.includes(s) };
}

export const WISHLIST_KEY = "prestige:wishlist";
export const RECENTLY_VIEWED_KEY = "prestige:recently-viewed";
