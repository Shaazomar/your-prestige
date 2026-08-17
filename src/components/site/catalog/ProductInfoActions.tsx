"use client";

import { useState } from "react";
import {
  MessageSquare,
  Share2,
  Plus,
  Minus,
  Check,
  ShoppingBag,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { generateSingleProductWhatsAppMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import { useEnquiryList } from "@/lib/enquiry-store";
import type { CatalogProduct } from "@/lib/catalog";
import { cn } from "@/lib/utils";

interface ProductInfoActionsProps {
  product: CatalogProduct;
  whatsappNumber: string;
}

const UNITS = ["Boxes", "Pieces", "Sq.ft", "Sq.m"];

export function ProductInfoActions({ product, whatsappNumber }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("Boxes");
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "Standard");
  const [ordering, setOrdering] = useState(false);
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);

  const { addItem } = useEnquiryList();

  const handleOrderWhatsApp = () => {
    if (ordering) return;
    setOrdering(true);

    const message = generateSingleProductWhatsAppMessage({
      productName: product.name,
      sku: product.sku || "N/A",
      size: selectedSize,
      finish: product.finish,
      quantity,
      unit,
      productUrl: typeof window !== "undefined" ? window.location.href : undefined,
    });

    const link = buildWhatsAppLink(whatsappNumber, message);

    fetch("/api/analytics/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "PRODUCT_CLICK",
        productId: product.id || product.slug,
        productName: product.name,
        quantity,
        unit,
        sourcePage: typeof window !== "undefined" ? window.location.pathname : undefined,
      }),
    }).catch(() => {});

    toast.success("Opening WhatsApp with your pre-filled enquiry...");
    setTimeout(() => {
      window.open(link, "_blank");
      setOrdering(false);
    }, 450);
  };

  const handleAddToEnquiryList = () => {
    if (adding) return;
    setAdding(true);

    addItem({
      id: product.id || product.slug,
      name: product.name,
      sku: product.sku,
      size: selectedSize,
      finish: product.finish,
      quantity,
      unit,
      image: product.lifestyleImage,
    });

    toast.success(`Added ${quantity} ${unit} of ${product.name} to Enquiry List!`);
    setTimeout(() => {
      setAdding(false);
    }, 400);
  };

  const handleShare = async () => {
    const shareData = {
      title: `${product.name} — Prestige Tiles`,
      text: `Discover ${product.name} by ${product.brand} at Prestige Tiles.`,
      url: typeof window !== "undefined" ? window.location.href : "",
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fallback to clipboard if share dialog dismissed or cancelled
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      toast.success("✓ Link copied to clipboard");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-6 pt-2">
      {/* Sizing Selector (if multiple sizes exist) */}
      {product.sizes && product.sizes.length > 0 && (
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-muted mb-2.5">
            Format / Dimensions
          </label>
          <div className="flex flex-wrap gap-2.5">
            {product.sizes.map((size) => {
              const isSelected = size === selectedSize;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={cn(
                    "rounded-xl px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-300",
                    "border",
                    isSelected
                      ? "bg-text text-white border-text shadow-sm scale-[1.02]"
                      : "bg-surface text-text border-line hover:border-text/40 hover:bg-secondary"
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity & Unit Selection Bar */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-widest text-muted mb-2.5">
          Project Quantity (Estimated)
        </label>
        <div className="flex flex-wrap items-center gap-3">
          {/* Minus/Plus Counter */}
          <div className="flex items-center rounded-xl border border-line bg-secondary/80 p-1">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="grid h-8 w-8 place-items-center rounded-lg text-text/70 hover:bg-surface hover:text-text transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-10 text-center font-mono text-sm font-bold text-text">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="grid h-8 w-8 place-items-center rounded-lg text-text/70 hover:bg-surface hover:text-text transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Unit Dropdown */}
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="h-10 rounded-xl border border-line bg-surface px-3 py-1 text-xs font-semibold text-text focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary & Secondary Action Buttons */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={handleOrderWhatsApp}
          disabled={ordering}
          className={cn(
            "group relative flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 transition-all duration-300",
            "bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm tracking-wide shadow-lift hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]",
            "min-h-[56px] disabled:opacity-70 disabled:cursor-not-allowed"
          )}
        >
          {ordering ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Opening WhatsApp...</span>
            </>
          ) : (
            <>
              <MessageSquare className="h-5 w-5 fill-current" />
              <span>ENQUIRE ON WHATSAPP</span>
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </>
          )}
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleAddToEnquiryList}
            disabled={adding}
            className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-xs font-bold text-text hover:border-text/30 hover:bg-secondary transition-all"
          >
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted" />
            ) : (
              <ShoppingBag className="h-4 w-4 text-gold" />
            )}
            <span>Add to Enquiry List</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-xs font-bold text-text hover:border-text/30 hover:bg-secondary transition-all"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-700">Link Copied</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 text-muted" />
                <span>Share Product</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
type Props = ProductInfoActionsProps;
