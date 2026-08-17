"use client";

import { useState } from "react";
import { ChevronDown, FileText, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CatalogProduct } from "@/lib/catalog";

interface TechnicalAccordionProps {
  product: CatalogProduct;
}

export function TechnicalAccordion({ product }: TechnicalAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const specs = [
    { label: "Product Name", value: product.name },
    { label: "Brand", value: product.brand },
    { label: "Collection", value: product.collection },
    { label: "Category", value: product.category.toUpperCase() },
    { label: "Surface / Finish", value: product.finish },
    { label: "Texture Descriptor", value: product.texture },
    { label: "Slab Thickness", value: product.thickness },
    { label: "Available Sizes", value: product.sizes.join(" · ") || "Standard" },
    { label: "Color Palette", value: product.color },
    { label: "Product SKU / Code", value: product.sku || `PT-${product.slug.slice(0, 5).toUpperCase()}` },
  ];

  return (
    <div className="w-full">
      {/* Mobile Accordion Toggle Header */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface p-5 text-left transition-all hover:bg-secondary"
        >
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-gold" />
            <div>
              <h3 className="font-serif text-base font-medium text-text">
                Technical Specifications
              </h3>
              <p className="text-[11px] text-muted">
                Dimensions, thickness, and material details
              </p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-muted transition-transform duration-300",
              isOpen && "rotate-180 text-text"
            )}
          />
        </button>

        {isOpen && (
          <div className="mt-3 divide-y divide-line/40 rounded-2xl border border-line bg-surface p-5 text-xs shadow-sm">
            {specs.map((item) => (
              <div key={item.label} className="flex justify-between py-2.5">
                <span className="font-medium text-muted">{item.label}</span>
                <span className="font-semibold text-text text-right">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Specification Grid */}
      <div className="hidden md:block">
        <div className="rounded-3xl border border-line/60 bg-surface p-8 shadow-soft">
          <h3 className="font-serif text-2xl font-light text-text mb-6">
            Technical Specifications & Standards
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {specs.map((item) => (
              <div
                key={item.label}
                className="border-b border-line/40 pb-4 transition-colors hover:border-gold/50"
              >
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted">
                  <CheckCircle2 className="h-3 w-3 text-gold" />
                  {item.label}
                </div>
                <div className="mt-1.5 font-serif text-lg text-text font-medium">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
