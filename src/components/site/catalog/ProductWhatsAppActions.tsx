"use client";

import { useState } from "react";
import { generateSingleProductWhatsAppMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import { useEnquiryList } from "@/lib/enquiry-store";
import { ArrowUpRight, Plus, Minus, ShoppingBag, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { CatalogProduct } from "@/lib/catalog";

interface Props {
  product: CatalogProduct;
  whatsappNumber: string;
}

const UNITS = ["Boxes", "Pieces", "Sq.ft", "Sq.m"];

export function ProductWhatsAppActions({ product, whatsappNumber }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("Boxes");
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "Standard");
  const [ordering, setOrdering] = useState(false);
  const [adding, setAdding] = useState(false);

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
    }, 500);
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

  return (
    <div className="space-y-4 max-w-xl">
      {/* Quantity & Unit & Size Pickers */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
        {/* Quantity Controls */}
        <div className="flex items-center gap-2 bg-black/40 rounded-xl px-3 py-1.5 border border-white/10">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center text-sm font-bold font-mono text-gold">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Unit Select */}
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-semibold focus:border-gold outline-none"
        >
          {UNITS.map((u) => (
            <option key={u} value={u} className="bg-[#141413] text-white">
              {u}
            </option>
          ))}
        </select>

        {/* Size Picker if multiple sizes */}
        {product.sizes.length > 1 && (
          <select
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-semibold focus:border-gold outline-none"
          >
            {product.sizes.map((s) => (
              <option key={s} value={s} className="bg-[#141413] text-white">
                {s}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleOrderWhatsApp}
          disabled={ordering || adding}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-4 text-sm font-bold text-white shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed min-h-[56px]"
        >
          {ordering ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Preparing WhatsApp...
            </>
          ) : (
            <>
              <MessageSquare className="h-5 w-5" />
              Order on WhatsApp
              <ArrowUpRight className="h-4 w-4" />
            </>
          )}
        </button>

        <button
          onClick={handleAddToEnquiryList}
          disabled={ordering || adding}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 backdrop-blur-md px-5 py-4 text-sm font-bold text-white transition-colors hover:bg-white hover:text-black disabled:opacity-60 disabled:cursor-not-allowed min-h-[56px]"
        >
          {adding ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" />
              Add to Enquiry List
            </>
          )}
        </button>
      </div>
    </div>
  );
}
