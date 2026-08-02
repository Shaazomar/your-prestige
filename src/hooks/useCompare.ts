"use client";

import { useLocalCollection } from "./useLocalCollection";
import { useCallback } from "react";

export const COMPARE_KEY = "prestige:compare";
export const MAX_COMPARE_ITEMS = 4;

export function useCompare() {
  const { items, ready, add, remove, toggle, clear, has } = useLocalCollection(
    COMPARE_KEY,
    MAX_COMPARE_ITEMS
  );

  const canAddMore = items.length < MAX_COMPARE_ITEMS;

  const toggleCompare = useCallback(
    (slug: string) => {
      if (!has(slug) && !canAddMore) {
        return false;
      }
      return toggle(slug);
    },
    [canAddMore, has, toggle]
  );

  return {
    items,
    ready,
    add,
    remove,
    toggle: toggleCompare,
    clear,
    has,
    canAddMore,
    count: items.length,
  };
}
