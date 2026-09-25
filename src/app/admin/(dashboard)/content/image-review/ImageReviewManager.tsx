"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Search,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Upload,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  Loader2,
} from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import {
  getImageReviewProducts,
  getImageReviewStats,
  updateProductImageAction,
  setProductVisibilityAction,
  recoverSingleProductAction,
  batchRecoverMissingAction,
  type ImageReviewRow,
  type ImageReviewStats,
  type StatusTab,
} from "./actions";

interface ImageReviewManagerProps {
  canEdit: boolean;
  initialStats: ImageReviewStats;
  brands: { id: string; name: string }[];
}

export function ImageReviewManager({
  canEdit,
  initialStats,
  brands,
}: ImageReviewManagerProps) {
  const [stats, setStats] = useState<ImageReviewStats>(initialStats);
  const [tab, setTab] = useState<StatusTab>("missing");
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<ImageReviewRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);

  // Modal states
  const [uploadModalProduct, setUploadModalProduct] = useState<ImageReviewRow | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchResult, setBatchResult] = useState<{
    totalProcessed: number;
    recovered: number;
    needsReview: number;
    notFound: number;
  } | null>(null);
  const [batchRunning, setBatchRunning] = useState(false);

  // Status notification
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      getImageReviewProducts({
        tab,
        search: search.trim() || undefined,
        brandId: selectedBrand || undefined,
        page,
        limit: 25,
      }),
      getImageReviewStats(),
    ])
      .then(([res, newStats]) => {
        setProducts(res.products);
        setTotalPages(res.totalPages);
        setTotalCount(res.total);
        setStats(newStats);
      })
      .catch(() => {
        setFeedback({ type: "error", message: "Failed to load catalogue images." });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tab, search, selectedBrand, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateImage = async (productId: string, url: string, publish = true) => {
    try {
      await updateProductImageAction(productId, url, publish);
      setFeedback({ type: "success", message: "Product image successfully updated." });
      setUploadModalProduct(null);
      setCustomImageUrl("");
      loadData();
    } catch (err: unknown) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to update image." });
    }
  };

  const handleToggleVisibility = async (product: ImageReviewRow) => {
    try {
      const willPublish = !product.published;
      const newStatus = willPublish ? "ACTIVE" : "DRAFT";
      await setProductVisibilityAction(product.id, newStatus, willPublish);
      setFeedback({
        type: "success",
        message: willPublish ? "Product published successfully." : "Product hidden from public catalogue.",
      });
      loadData();
    } catch (err: unknown) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to change visibility." });
    }
  };

  const handleSingleRecover = async (productId: string) => {
    try {
      const res = await recoverSingleProductAction(productId);
      if (res.recovered) {
        setFeedback({ type: "success", message: `Image recovered and published from ${res.source}!` });
      } else {
        setFeedback({ type: "error", message: res.message || "No verified image found." });
      }
      loadData();
    } catch (err: unknown) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Recovery failed." });
    }
  };

  const handleRunBatchRecovery = async () => {
    setBatchRunning(true);
    setBatchResult(null);
    try {
      const result = await batchRecoverMissingAction(50);
      setBatchResult(result);
      loadData();
    } catch (err: unknown) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Batch recovery failed." });
    } finally {
      setBatchRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm transition-all ${
            feedback.type === "success"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="ml-3 rounded-lg p-1 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <span className="text-xs uppercase tracking-wider text-white/40">Total Scanned</span>
          <p className="mt-1 text-2xl font-bold text-white">{stats.total.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <span className="text-xs uppercase tracking-wider text-emerald-400">Valid Images</span>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{stats.valid.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
          <span className="text-xs uppercase tracking-wider text-rose-400">Missing Images</span>
          <p className="mt-1 text-2xl font-bold text-rose-400">{stats.missing.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <span className="text-xs uppercase tracking-wider text-amber-400">Needs Review</span>
          <p className="mt-1 text-2xl font-bold text-amber-400">{stats.needsReview.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <span className="text-xs uppercase tracking-wider text-white/50">Draft / Hidden</span>
          <p className="mt-1 text-2xl font-bold text-white/80">{stats.draftHidden.toLocaleString()}</p>
        </div>
      </div>

      {/* Bulk Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gold/20 bg-gold/5 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Batch Image Recovery</h3>
            <p className="text-xs text-white/50">
              Scans products safely in 50-item batches, recovers verified original photography & optimizes to S3.
            </p>
          </div>
        </div>

        {canEdit && (
          <button
            onClick={() => {
              setBatchModalOpen(true);
              setBatchResult(null);
            }}
            className="flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-xs font-semibold text-black shadow-lg shadow-gold/10 transition-all hover:bg-gold/90 active:scale-[0.98]"
          >
            <RefreshCw className="h-4 w-4" />
            Recover Missing Images
          </button>
        )}
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-white/5 bg-white/[0.02] p-1">
          {[
            { id: "missing", label: "Missing Images", count: stats.missing },
            { id: "review", label: "Needs Review", count: stats.needsReview },
            { id: "recovered", label: "Recovered" },
            { id: "all", label: "All Products", count: stats.total },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id as StatusTab);
                setPage(1);
              }}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                tab === t.id
                  ? "bg-white/10 text-white shadow"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>{t.label}</span>
              {typeof t.count === "number" && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    tab === t.id
                      ? "bg-gold text-black font-semibold"
                      : "bg-white/10 text-white/60"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Brand Filter */}
          <select
            value={selectedBrand}
            onChange={(e) => {
              setSelectedBrand(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-gold focus:outline-none"
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search product, SKU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-48 rounded-xl border border-white/10 bg-black/40 pl-9 pr-3 py-2 text-xs text-white placeholder-white/30 focus:border-gold focus:outline-none sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gold" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-400/50" />
            <h3 className="mt-3 text-sm font-semibold text-white">No products found</h3>
            <p className="mt-1 text-xs text-white/40">
              All products in this category currently have valid photography or match your filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/5 bg-white/[0.02] text-[10px] uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-4 py-3">Thumbnail</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Brand & Category</th>
                  <th className="px-4 py-3">SKU / Code</th>
                  <th className="px-4 py-3">Image Status</th>
                  <th className="px-4 py-3">Catalogue Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {products.map((p) => {
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-white/[0.02]">
                      {/* Thumbnail */}
                      <td className="px-4 py-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-white/10 bg-black/40">
                          <SafeImage
                            src={p.resolvedImage || ""}
                            alt={p.name}
                            fill
                            className="object-cover"
                            placeholderLabel="No Image"
                          />
                        </div>
                      </td>

                      {/* Product Name & Slug */}
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{p.name}</p>
                        <p className="text-[10px] text-white/40">{p.slug}</p>
                        {p.reviewReason && (
                          <span className="mt-1 inline-block rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] text-amber-400">
                            {p.reviewReason}
                          </span>
                        )}
                      </td>

                      {/* Brand & Category */}
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-md bg-white/5 px-2 py-0.5 font-medium text-white/80">
                          {p.brandName}
                        </span>
                        <p className="mt-0.5 text-[10px] text-white/40">{p.categoryName}</p>
                      </td>

                      {/* SKU / Code */}
                      <td className="px-4 py-3 font-mono text-[11px] text-white/70">
                        {p.sku || p.productCode || "—"}
                      </td>

                      {/* Image Status */}
                      <td className="px-4 py-3">
                        {p.resolvedImage ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-400">
                            <AlertCircle className="h-3 w-3" /> Missing
                          </span>
                        )}
                      </td>

                      {/* Catalogue Status */}
                      <td className="px-4 py-3">
                        {p.published && p.status === "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                            <Eye className="h-3 w-3" /> Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/50">
                            <EyeOff className="h-3 w-3" /> Hidden (Draft)
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canEdit && (
                            <>
                              <button
                                title="Upload / Set Image"
                                onClick={() => {
                                  setUploadModalProduct(p);
                                  setCustomImageUrl(p.lifestyleImage || "");
                                }}
                                className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
                              >
                                <Upload className="h-3.5 w-3.5" />
                              </button>

                              <button
                                title="Attempt Automatic Recovery"
                                onClick={() => handleSingleRecover(p.id)}
                                className="rounded-lg border border-gold/20 bg-gold/5 p-1.5 text-gold hover:bg-gold/15"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                              </button>

                              <button
                                title={p.published ? "Hide Product" : "Publish Product"}
                                onClick={() => handleToggleVisibility(p)}
                                className={`rounded-lg border p-1.5 ${
                                  p.published
                                    ? "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                                    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                }`}
                              >
                                {p.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/5 bg-white/[0.01] px-4 py-3">
            <span className="text-xs text-white/40">
              Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, totalCount)} of {totalCount} products
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/70 hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-medium text-white/70">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/70 hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload / Edit Modal */}
      {uploadModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Set Product Image</h3>
              <button
                onClick={() => setUploadModalProduct(null)}
                className="rounded-lg p-1 text-white/40 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <p className="text-xs text-white/60">Product:</p>
              <p className="font-medium text-white">{uploadModalProduct.name}</p>
              <p className="text-[11px] text-white/40">
                {uploadModalProduct.brandName} • {uploadModalProduct.sku || uploadModalProduct.slug}
              </p>
            </div>

            {/* Preview */}
            <div className="relative h-44 w-full overflow-hidden rounded-xl border border-white/10 bg-black/40">
              <SafeImage
                src={customImageUrl || ""}
                alt={uploadModalProduct.name}
                fill
                className="object-contain"
                placeholderLabel="Preview will appear here"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-white/70">Image URL or S3 Key</label>
              <input
                type="text"
                placeholder="https://... or prestige/catalog/..."
                value={customImageUrl}
                onChange={(e) => setCustomImageUrl(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-gold focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setUploadModalProduct(null)}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-white/70 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateImage(uploadModalProduct.id, customImageUrl, false)}
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-medium text-white hover:bg-white/20"
              >
                Save as Draft
              </button>
              <button
                onClick={() => handleUpdateImage(uploadModalProduct.id, customImageUrl, true)}
                className="rounded-xl bg-gold px-4 py-2 text-xs font-semibold text-black hover:bg-gold/90"
              >
                Save & Publish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Recovery Modal */}
      {batchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-gold" />
                <h3 className="text-base font-semibold text-white">Batch Image Recovery</h3>
              </div>
              <button
                onClick={() => setBatchModalOpen(false)}
                className="rounded-lg p-1 text-white/40 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs leading-relaxed text-white/60">
              Processes a batch of 50 missing-image products safely. Searches existing imported media records,
              verifies source photography, downloads server-side, and stores high-resolution WebP masters on S3.
            </p>

            {batchRunning ? (
              <div className="flex flex-col items-center justify-center py-6 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
                <p className="text-xs font-medium text-white/80">Processing batch safely (50 products)...</p>
                <p className="text-[10px] text-white/40">Validating & re-hosting assets...</p>
              </div>
            ) : batchResult ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                <h4 className="text-xs font-semibold text-white">Batch Result:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-white/60">Processed: <span className="font-semibold text-white">{batchResult.totalProcessed}</span></div>
                  <div className="text-emerald-400">Recovered: <span className="font-semibold">{batchResult.recovered}</span></div>
                  <div className="text-amber-400">Needs Review: <span className="font-semibold">{batchResult.needsReview}</span></div>
                  <div className="text-white/40">Not Found: <span className="font-semibold">{batchResult.notFound}</span></div>
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                disabled={batchRunning}
                onClick={() => setBatchModalOpen(false)}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-white/70 hover:bg-white/5 disabled:opacity-40"
              >
                Close
              </button>
              <button
                disabled={batchRunning}
                onClick={handleRunBatchRecovery}
                className="flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-xs font-semibold text-black hover:bg-gold/90 disabled:opacity-40"
              >
                {batchRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Run Batch (50 items)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
