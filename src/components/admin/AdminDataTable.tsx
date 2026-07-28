"use client";

import type { ReactNode } from "react";
import {
  Search, ArrowUp, ArrowDown, ChevronLeft, ChevronRight,
  Trash2, RotateCcw, Loader2, Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render: (row: T) => ReactNode;
  className?: string;
}

interface AdminDataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  sortDir: "asc" | "desc";
  onSort: (column: string) => void;
  loading: boolean;
  initialLoad: boolean;
  getId: (row: T) => string;
  trash: boolean;
  onTrashToggle: (trash: boolean) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onRestore?: (row: T) => void;
  toolbar?: ReactNode;
  emptyMessage?: string;
  searchPlaceholder?: string;
  rowActions?: (row: T) => ReactNode;
  hideTrashToggle?: boolean;
}

export function AdminDataTable<T>({
  columns,
  rows,
  total,
  page,
  pageSize,
  onPageChange,
  search,
  onSearchChange,
  sortBy,
  sortDir,
  onSort,
  loading,
  initialLoad,
  getId,
  trash,
  onTrashToggle,
  onEdit,
  onDelete,
  onRestore,
  toolbar,
  emptyMessage = "Nothing here yet.",
  searchPlaceholder = "Search…",
  rowActions,
  hideTrashToggle,
}: AdminDataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="rounded-2xl border border-white/8 bg-[#141413]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-white/8 p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-colors focus:border-gold"
          />
        </div>

        {!hideTrashToggle && (
          <div className="flex overflow-hidden rounded-xl border border-white/10">
            <button
              onClick={() => onTrashToggle(false)}
              className={cn(
                "px-3.5 py-2 text-xs font-medium transition-colors",
                !trash ? "bg-gold/15 text-gold" : "text-white/50 hover:text-white"
              )}
            >
              Active
            </button>
            <button
              onClick={() => onTrashToggle(true)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium transition-colors",
                trash ? "bg-gold/15 text-gold" : "text-white/50 hover:text-white"
              )}
            >
              <Trash2 className="h-3 w-3" />
              Trash
            </button>
          </div>
        )}

        {toolbar}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/8">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/35", col.className)}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => onSort(col.key)}
                      className="flex items-center gap-1 transition-colors hover:text-white"
                    >
                      {col.label}
                      {sortBy === col.key &&
                        (sortDir === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        ))}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
              {(onEdit || onDelete || onRestore || rowActions) && (
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/35">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {initialLoad ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-16 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-white/30" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-16 text-center">
                  <Inbox className="mx-auto mb-3 h-8 w-8 text-white/15" />
                  <p className="text-sm text-white/35">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={getId(row)}
                  className={cn(
                    "border-b border-white/5 transition-opacity last:border-0 hover:bg-white/[0.02]",
                    loading && "opacity-50"
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3.5 align-middle", col.className)}>
                      {col.render(row)}
                    </td>
                  ))}
                  {(onEdit || onDelete || onRestore || rowActions) && (
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {rowActions?.(row)}
                        {onEdit && !trash && (
                          <button
                            onClick={() => onEdit(row)}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-white/50 transition-colors hover:bg-white/8 hover:text-white"
                          >
                            Edit
                          </button>
                        )}
                        {onDelete && !trash && (
                          <button
                            onClick={() => onDelete(row)}
                            aria-label="Delete"
                            className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-red-500/10 hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {onRestore && trash && (
                          <button
                            onClick={() => onRestore(row)}
                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-400/10"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between border-t border-white/8 px-4 py-3">
          <p className="text-xs text-white/35">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/8 hover:text-white disabled:opacity-25"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs text-white/40">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/8 hover:text-white disabled:opacity-25"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
