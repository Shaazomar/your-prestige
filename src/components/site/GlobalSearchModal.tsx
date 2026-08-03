"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, ArrowUpRight, CornerDownLeft } from "lucide-react";
import { products, applicationList, collectionList } from "@/lib/catalog";
import { cn } from "@/lib/utils";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RECENTS_KEY = "prestige:recent-searches";
const MAX_RECENTS = 5;

/** One selectable row. Everything in the overlay is normalised to this. */
interface Hit {
  id: string;
  href: string;
  label: string;
  meta?: string;
  image?: string;
  group: string;
}

function readRecents(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Fullscreen search.
 *
 * Empty state shows recent searches, popular collections and popular
 * products; typing filters instantly. Arrow keys move through a single flat
 * list of hits regardless of which group they belong to, so Enter always has
 * an unambiguous target.
 */
export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const [recents, setRecents] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setRecents(readRecents());
      setQuery("");
      setCursor(0);
      // Autofocus after the entry transition, or the caret lands mid-animation.
      const t = window.setTimeout(() => inputRef.current?.focus(), 120);
      return () => window.clearTimeout(t);
    }
  }, [isOpen]);

  // Scroll lock, preserving scroll position across open/close.
  useEffect(() => {
    if (!isOpen) return;
    const y = window.scrollY;
    const { body } = document;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflowY: body.style.overflowY,
    };
    body.style.position = "fixed";
    body.style.top = `-${y}px`;
    body.style.width = "100%";
    body.style.overflowY = "scroll";
    return () => {
      Object.assign(body.style, prev);
      window.scrollTo(0, y);
    };
  }, [isOpen]);

  const trimmed = query.trim().toLowerCase();

  const hits = useMemo<Hit[]>(() => {
    if (!trimmed) {
      return [
        ...collectionList.slice(0, 4).map((c) => ({
          id: `col:${c}`,
          href: `/products?collection=${encodeURIComponent(c)}`,
          label: c,
          group: "Popular collections",
        })),
        ...products.slice(0, 4).map((p) => ({
          id: `prod:${p.slug}`,
          href: `/products/${p.category}/${p.slug}`,
          label: p.name,
          meta: `${p.brand} · ${p.finish}`,
          image: p.lifestyleImage,
          group: "Popular products",
        })),
      ];
    }

    const matchedProducts = products
      .filter((p) =>
        [p.name, p.collection, p.brand, p.color, p.finish].some((f) =>
          f.toLowerCase().includes(trimmed)
        )
      )
      .slice(0, 8)
      .map((p) => ({
        id: `prod:${p.slug}`,
        href: `/products/${p.category}/${p.slug}`,
        label: p.name,
        meta: `${p.brand} · ${p.finish}`,
        image: p.lifestyleImage,
        group: "Products",
      }));

    const matchedCollections = collectionList
      .filter((c) => c.toLowerCase().includes(trimmed))
      .slice(0, 4)
      .map((c) => ({
        id: `col:${c}`,
        href: `/products?collection=${encodeURIComponent(c)}`,
        label: c,
        group: "Collections",
      }));

    const matchedApplications = applicationList
      .filter((a) => a.toLowerCase().includes(trimmed))
      .slice(0, 4)
      .map((a) => ({
        id: `app:${a}`,
        href: `/applications/${a.toLowerCase().replace(/\s+/g, "-")}`,
        label: a,
        group: "Spaces",
      }));

    return [...matchedProducts, ...matchedCollections, ...matchedApplications];
  }, [trimmed]);

  // Keep the cursor in range as the result set shrinks under the user.
  useEffect(() => {
    setCursor((c) => (c >= hits.length ? 0 : c));
  }, [hits.length]);

  const commit = useCallback(
    (hit: Hit) => {
      if (trimmed) {
        const next = [query.trim(), ...recents.filter((r) => r !== query.trim())].slice(
          0,
          MAX_RECENTS
        );
        setRecents(next);
        try {
          window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
        } catch {
          // Private mode / quota — recents are a nicety, never block navigation.
        }
      }
      onClose();
      router.push(hit.href);
    },
    [onClose, query, recents, router, trimmed]
  );

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) => (hits.length ? (c + 1) % hits.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => (hits.length ? (c - 1 + hits.length) % hits.length : 0));
      } else if (e.key === "Enter" && hits[cursor]) {
        e.preventDefault();
        commit(hits[cursor]);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, hits, cursor, commit, onClose]);

  // Keep the highlighted row in view during keyboard traversal.
  useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  // Render group headings by tracking where the group label changes.
  let lastGroup = "";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[70] flex flex-col bg-canvas/97 backdrop-blur-2xl"
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <div className="mx-auto flex h-full w-full max-w-4xl flex-col px-6 pb-8 pt-6 sm:px-8">
            {/* Input */}
            <div className="flex items-center gap-4 border-b border-line pb-5">
              <Search className="h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search collections, products, spaces…"
                aria-label="Search"
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent text-lg text-text placeholder:text-faint focus:outline-none md:text-xl"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-faint transition-colors hover:text-text"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-full border border-line px-3 py-1.5 text-[0.6875rem] tracking-wide text-faint transition-colors hover:border-line-strong hover:text-text"
              >
                ESC
              </button>
            </div>

            {/* Recents */}
            {!trimmed && recents.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-6">
                <span className="text-eyebrow mr-1 text-faint">Recent</span>
                {recents.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setQuery(r)}
                    className="rounded-full border border-line px-3.5 py-1.5 text-[0.8125rem] text-muted transition-colors duration-500 hover:border-gold hover:text-gold"
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}

            {/* Results */}
            <div ref={listRef} className="-mx-2 flex-1 overflow-y-auto px-2 pt-6">
              {hits.length === 0 ? (
                <p className="py-16 text-center text-muted">
                  Nothing matches “{query.trim()}”.
                </p>
              ) : (
                <ul className="space-y-1">
                  {hits.map((hit, i) => {
                    const heading = hit.group !== lastGroup ? hit.group : null;
                    lastGroup = hit.group;
                    const active = i === cursor;

                    return (
                      <li key={hit.id}>
                        {heading && (
                          <h2 className="text-eyebrow px-3 pb-2 pt-5 text-faint first:pt-0">
                            {heading}
                          </h2>
                        )}
                        <button
                          type="button"
                          data-active={active}
                          onMouseEnter={() => setCursor(i)}
                          onClick={() => commit(hit)}
                          className={cn(
                            "group flex w-full items-center gap-4 rounded-2xl px-3 py-2.5 text-left",
                            "transition-colors duration-300",
                            active ? "bg-surface" : "hover:bg-surface/60"
                          )}
                        >
                          {hit.image ? (
                            <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-surface">
                              <Image
                                src={hit.image}
                                alt=""
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </span>
                          ) : (
                            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-surface">
                              <Search className="h-4 w-4 text-faint" aria-hidden="true" />
                            </span>
                          )}

                          <span className="min-w-0 flex-1">
                            <span
                              className={cn(
                                "block truncate text-[0.9375rem] transition-colors",
                                active ? "text-gold" : "text-text"
                              )}
                            >
                              {hit.label}
                            </span>
                            {hit.meta && (
                              <span className="block truncate text-sm text-faint">
                                {hit.meta}
                              </span>
                            )}
                          </span>

                          <ArrowUpRight
                            className={cn(
                              "h-4 w-4 shrink-0 transition-opacity",
                              active ? "text-gold opacity-100" : "opacity-0"
                            )}
                            aria-hidden="true"
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Keyboard hints */}
            <div className="flex items-center gap-6 border-t border-line pt-5 text-[0.6875rem] text-faint">
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-line px-1.5 py-0.5">↑</kbd>
                <kbd className="rounded border border-line px-1.5 py-0.5">↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-line px-1.5 py-0.5">
                  <CornerDownLeft className="h-3 w-3" />
                </kbd>
                open
              </span>
              <span className="ml-auto hidden sm:inline">{hits.length} results</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
