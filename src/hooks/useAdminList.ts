"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

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

/**
 * Shared list state (search/sort/paginate/trash-toggle) for admin CRUD
 * screens, backed by a Server Action. Every module wires its own
 * `fetchAction` (a "use server" list query) into this hook and gets
 * consistent, instant filtering behavior for free.
 */
export function useAdminList<T>(
  fetchAction: (params: ListParams) => Promise<ListResult<T>>,
  opts?: { pageSize?: number; initialSortBy?: string; initialSortDir?: "asc" | "desc" }
) {
  const pageSize = opts?.pageSize ?? 12;
  const [page, setPage] = useState(1);
  const [search, setSearchState] = useState("");
  const [sortBy, setSortBy] = useState(opts?.initialSortBy ?? "createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">(opts?.initialSortDir ?? "desc");
  const [trash, setTrashState] = useState(false);
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [initialLoad, setInitialLoad] = useState(true);

  const refresh = useCallback(() => {
    startTransition(async () => {
      const result = await fetchAction({ page, pageSize, search, sortBy, sortDir, trash });
      setRows(result.rows);
      setTotal(result.total);
      setInitialLoad(false);
    });
  }, [fetchAction, page, pageSize, search, sortBy, sortDir, trash]);

  useEffect(() => {
    refresh();
  }, [refresh]);

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
    loading: isPending,
    initialLoad,
    refresh,
  };
}
