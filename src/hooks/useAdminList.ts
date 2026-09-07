"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ListParams {
  page: number;
  pageSize: number;
  search: string;
  sortBy: string;
  sortDir: "asc" | "desc";
  trash: boolean;
}

export interface ListResult<T> {
  rows: T[];
  total: number;
}

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Shared list state (search/sort/paginate/trash-toggle) for admin CRUD
 * screens, backed by a Server Action. Every module wires its own
 * `fetchAction` (a "use server" list query) into this hook and gets
 * consistent, instant filtering behavior for free.
 *
 * `fetchAction` is held in a ref rather than being a dependency of the
 * fetching effect. Callers routinely pass an inline closure
 * (`(p) => listMedia({ ...p, folderId })`), which is a new function on every
 * render; depending on it meant refresh → setState → re-render → new closure
 * → refresh, an unbounded request loop that hammered the database for as
 * long as the page stayed open. Extra values such closures capture belong in
 * `opts.deps`, which is what re-triggers the query when they change.
 */
export function useAdminList<T>(
  fetchAction: (params: ListParams) => Promise<ListResult<T>>,
  opts?: {
    pageSize?: number;
    initialSortBy?: string;
    initialSortDir?: "asc" | "desc";
    /** Extra values the fetchAction closes over; changing one refetches. */
    deps?: readonly unknown[];
  }
) {
  const pageSize = opts?.pageSize ?? 12;
  const [page, setPage] = useState(1);
  const [search, setSearchState] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState(opts?.initialSortBy ?? "createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">(opts?.initialSortDir ?? "desc");
  const [trash, setTrashState] = useState(false);
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRef = useRef(fetchAction);
  fetchRef.current = fetchAction;

  // Monotonic request id — a slow earlier request must never overwrite the
  // results of a later one (type fast in the search box and the responses
  // come back out of order).
  const requestId = useRef(0);

  const deps = opts?.deps ?? [];
  const depsKey = JSON.stringify(deps);

  const runFetch = useCallback(
    async (params: ListParams) => {
      const id = ++requestId.current;
      setLoading(true);
      try {
        const result = await fetchRef.current(params);
        if (id !== requestId.current) return; // superseded
        setRows(result.rows);
        setTotal(result.total);
        setError(null);
      } catch (err) {
        if (id !== requestId.current) return;
        setRows([]);
        setTotal(0);
        setError(err instanceof Error ? err.message : "Could not load this list.");
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setInitialLoad(false);
        }
      }
    },
    []
  );

  const refresh = useCallback(() => {
    void runFetch({ page, pageSize, search: debouncedSearch, sortBy, sortDir, trash });
  }, [runFetch, page, pageSize, debouncedSearch, sortBy, sortDir, trash]);

  useEffect(() => {
    refresh();
    // depsKey is a serialized form of opts.deps — a caller-supplied value the
    // fetchAction closes over (a folder id, an entity filter).
  }, [refresh, depsKey]);

  // Debounce the search box so one keystroke isn't one round trip.
  useEffect(() => {
    if (search === debouncedSearch) return;
    const t = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search, debouncedSearch]);

  function setSearch(value: string) {
    setSearchState(value);
    setPage(1);
  }

  function setTrash(value: boolean) {
    setTrashState(value);
    setPage(1);
  }

  function toggleSort(column: string) {
    if (sortBy === column) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
    setPage(1);
  }

  return {
    rows,
    total,
    page,
    setPage,
    pageSize,
    search,
    setSearch,
    sortBy,
    sortDir,
    toggleSort,
    trash,
    setTrash,
    loading,
    initialLoad,
    error,
    refresh,
  };
}
