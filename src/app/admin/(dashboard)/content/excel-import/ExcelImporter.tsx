"use client";

import { useState, useRef } from "react";
import { Upload, ArrowRight, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { importProductRow, type ImportRowData } from "./actions";

type ImportStep = "UPLOAD" | "MAP" | "PREVIEW" | "IMPORTING" | "REPORT";

interface FieldMapping {
  sku: string;
  name: string;
  price: string;
  mrp: string;
  categoryName: string;
  collectionName: string;
  brandName: string;
  stock: string;
}

interface ParsedRow {
  index: number;
  data: ImportRowData;
  status: "NEW" | "UPDATE" | "INVALID";
  errors: string[];
}

export function ExcelImporter() {
  const [step, setStep] = useState<ImportStep>("UPLOAD");
  const [csvText, setCsvText] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<FieldMapping>({
    sku: "",
    name: "",
    price: "",
    mrp: "",
    categoryName: "",
    collectionName: "",
    brandName: "",
    stock: "",
  });
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState({
    created: 0,
    updated: 0,
    failed: 0,
    errors: [] as string[],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Native CSV Parser
  function parseCSV(text: string): string[][] {
    const result: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let entry = "";

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const next = text[i + 1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          entry += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        row.push(entry.trim());
        entry = "";
      } else if ((char === "\r" || char === "\n") && !inQuotes) {
        row.push(entry.trim());
        if (row.length > 0) {
          result.push(row);
        }
        row = [];
        entry = "";
        if (char === "\r" && next === "\n") i++;
      } else {
        entry += char;
      }
    }
    if (entry || row.length > 0) {
      row.push(entry.trim());
      result.push(row);
    }
    return result;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a valid CSV file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);

      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        toast.error("The CSV file is empty.");
        return;
      }

      const csvHeaders = parsed[0];
      setHeaders(csvHeaders);

      // Auto-map matching headers
      const newMapping = { ...mapping };
      csvHeaders.forEach((h) => {
        const lower = h.toLowerCase().trim();
        if (lower === "sku" || lower === "productcode" || lower === "code") newMapping.sku = h;
        if (lower === "name" || lower === "productname" || lower === "title") newMapping.name = h;
        if (lower === "price" || lower === "rate" || lower === "cost") newMapping.price = h;
        if (lower === "mrp" || lower === "maxprice") newMapping.mrp = h;
        if (lower === "category" || lower === "cat") newMapping.categoryName = h;
        if (lower === "collection" || lower === "series") newMapping.collectionName = h;
        if (lower === "brand" || lower === "make") newMapping.brandName = h;
        if (lower === "stock" || lower === "qty" || lower === "quantity") newMapping.stock = h;
      });

      setMapping(newMapping);
      setStep("MAP");
    };
    reader.readAsText(file);
  }

  function handleValidation() {
    if (!mapping.sku || !mapping.name) {
      toast.error("SKU and Name mappings are required.");
      return;
    }

    const parsed = parseCSV(csvText);
    const rowsToParse = parsed.slice(1); // skip headers
    const newParsedRows: ParsedRow[] = [];

    rowsToParse.forEach((row, idx) => {
      if (row.length === 0 || row.join("").trim() === "") return;

      const getVal = (headerName: string) => {
        if (!headerName) return undefined;
        const colIdx = headers.indexOf(headerName);
        return colIdx !== -1 ? row[colIdx] : undefined;
      };

      const sku = getVal(mapping.sku)?.trim() || "";
      const name = getVal(mapping.name)?.trim() || "";
      const priceStr = getVal(mapping.price);
      const mrpStr = getVal(mapping.mrp);
      const categoryName = getVal(mapping.categoryName)?.trim() || null;
      const collectionName = getVal(mapping.collectionName)?.trim() || null;
      const brandName = getVal(mapping.brandName)?.trim() || null;
      const stockStr = getVal(mapping.stock);

      const errors: string[] = [];
      if (!sku) errors.push("Missing SKU");
      if (!name) errors.push("Missing Name");

      const price = priceStr ? Number(priceStr.replace(/[^\d.]/g, "")) : null;
      const mrp = mrpStr ? Number(mrpStr.replace(/[^\d.]/g, "")) : null;
      const stock = stockStr ? Number(stockStr.replace(/[^\d.]/g, "")) : null;

      if (priceStr && isNaN(Number(price))) errors.push(`Invalid price format: ${priceStr}`);
      if (mrpStr && isNaN(Number(mrp))) errors.push(`Invalid MRP format: ${mrpStr}`);
      if (stockStr && isNaN(Number(stock))) errors.push(`Invalid stock quantity: ${stockStr}`);

      newParsedRows.push({
        index: idx + 2, // Excel row numbering (1-indexed + header row)
        data: {
          sku,
          name,
          price,
          mrp,
          categoryName,
          collectionName,
          brandName,
          stock,
        },
        status: errors.length > 0 ? "INVALID" : "NEW", // Simple default status
        errors,
      });
    });

    setParsedRows(newParsedRows);
    setStep("PREVIEW");
  }

  async function triggerImport() {
    setStep("IMPORTING");
    setImportProgress(0);

    const validRows = parsedRows.filter((r) => r.status !== "INVALID");
    let created = 0;
    let updated = 0;
    let failed = 0;
    const errorsList: string[] = [];

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        const res = await importProductRow(row.data);
        if (res.actionType === "created") created++;
        else updated++;
      } catch (err) {
        failed++;
        errorsList.push(`Row ${row.index} (SKU: ${row.data.sku}): ${err instanceof Error ? err.message : "Failed to import"}`);
      }
      setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    setImportResults({
      created,
      updated,
      failed,
      errors: errorsList,
    });
    setStep("REPORT");
    toast.success("Excel bulk import process completed");
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-[#141413] p-6 space-y-6">
      {/* Step Indicators */}
      <div className="flex items-center gap-4 text-xs font-semibold text-white/30 border-b border-white/8 pb-4">
        <span className={step === "UPLOAD" ? "text-gold" : ""}>1. Upload Excel/CSV</span>
        <ArrowRight className="h-3 w-3" />
        <span className={step === "MAP" ? "text-gold" : ""}>2. Map Columns</span>
        <ArrowRight className="h-3 w-3" />
        <span className={step === "PREVIEW" ? "text-gold" : ""}>3. Preview & Validate</span>
        <ArrowRight className="h-3 w-3" />
        <span className={step === "IMPORTING" ? "text-gold" : ""}>4. Importing</span>
        <ArrowRight className="h-3 w-3" />
        <span className={step === "REPORT" ? "text-gold" : ""}>5. Import Report</span>
      </div>

      {/* Step 1: Upload */}
      {step === "UPLOAD" && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl p-12 hover:border-gold hover:bg-white/5 transition-all cursor-pointer text-center group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />
          <div className="rounded-full bg-gold/15 p-4 mb-4 group-hover:scale-110 transition-transform">
            <Upload className="h-6 w-6 text-gold" />
          </div>
          <h3 className="font-semibold text-white mb-1">Select Excel or CSV file</h3>
          <p className="text-xs text-white/40 max-w-sm">
            Supported format: CSV (Comma-separated values). Please export your spreadsheet to CSV format before uploading.
          </p>
        </div>
      )}

      {/* Step 2: Map Columns */}
      {step === "MAP" && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-white">Map Spreadsheet Columns</h3>
            <p className="text-xs text-white/45">Match your CSV column headers to the product database properties.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-white/60">Product SKU (Required) *</label>
              <select
                value={mapping.sku}
                onChange={(e) => setMapping((m) => ({ ...m, sku: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white"
              >
                <option value="">-- Choose Column --</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-white/60">Product Name (Required) *</label>
              <select
                value={mapping.name}
                onChange={(e) => setMapping((m) => ({ ...m, name: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white"
              >
                <option value="">-- Choose Column --</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-white/60">Selling Price (Optional)</label>
              <select
                value={mapping.price}
                onChange={(e) => setMapping((m) => ({ ...m, price: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white"
              >
                <option value="">-- Choose Column --</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-white/60">MRP (Optional)</label>
              <select
                value={mapping.mrp}
                onChange={(e) => setMapping((m) => ({ ...m, mrp: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white"
              >
                <option value="">-- Choose Column --</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-white/60">Category Name (Optional)</label>
              <select
                value={mapping.categoryName}
                onChange={(e) => setMapping((m) => ({ ...m, categoryName: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white"
              >
                <option value="">-- Choose Column --</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-white/60">Collection Name (Optional)</label>
              <select
                value={mapping.collectionName}
                onChange={(e) => setMapping((m) => ({ ...m, collectionName: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white"
              >
                <option value="">-- Choose Column --</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-white/60">Brand Name (Optional)</label>
              <select
                value={mapping.brandName}
                onChange={(e) => setMapping((m) => ({ ...m, brandName: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white"
              >
                <option value="">-- Choose Column --</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-white/60">Inventory Stock Level (Optional)</label>
              <select
                value={mapping.stock}
                onChange={(e) => setMapping((m) => ({ ...m, stock: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white"
              >
                <option value="">-- Choose Column --</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-3">
            <button
              onClick={() => setStep("UPLOAD")}
              className="rounded-xl border border-white/12 px-5 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/5 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleValidation}
              className="rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-ivory hover:bg-gold-deep transition-colors"
            >
              Validate & Preview
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === "PREVIEW" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-white">Import Preview & Validation</h3>
              <p className="text-xs text-white/45">
                We found {parsedRows.length} rows to import. Verified rows can be saved immediately.
              </p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="rounded-full bg-red-500/15 border border-red-500/30 px-3 py-1 font-bold text-red-300">
                {parsedRows.filter((r) => r.status === "INVALID").length} Errors
              </span>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 font-bold text-emerald-300">
                {parsedRows.filter((r) => r.status !== "INVALID").length} Ready
              </span>
            </div>
          </div>

          {/* Tabular Preview */}
          <div className="rounded-xl border border-white/8 bg-white/5 overflow-hidden">
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs text-white/70">
                <thead className="sticky top-0 bg-[#1c1c1b] border-b border-white/8 text-[11px] uppercase tracking-wider text-white/40">
                  <tr>
                    <th className="py-3 px-4">Row</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Price / MRP</th>
                    <th className="py-3 px-4">Brand / Coll.</th>
                    <th className="py-3 px-4">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {parsedRows.map((row) => (
                    <tr key={row.index} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-white/30">{row.index}</td>
                      <td className="py-3.5 px-4">
                        {row.status === "INVALID" ? (
                          <span className="inline-flex items-center gap-1 text-red-400 font-bold">
                            <AlertTriangle className="h-3 w-3" /> Error
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-medium">Ready</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {row.data.sku || "N/A"}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {row.data.name || "N/A"}
                        {row.errors.length > 0 && (
                          <p className="text-[10px] text-red-400 mt-1 font-sans">{row.errors.join(", ")}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        ₹{row.data.price ?? 0} <span className="text-white/20">/ ₹{row.data.mrp ?? 0}</span>
                      </td>
                      <td className="py-3.5 px-4 text-white/50">
                        {row.data.brandName || "—"} / {row.data.collectionName || "—"}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        {row.data.stock !== null ? `${row.data.stock} Slabs` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-3">
            <button
              onClick={() => setStep("MAP")}
              className="rounded-xl border border-white/12 px-5 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/5 transition-colors"
            >
              Back
            </button>
            <button
              onClick={triggerImport}
              disabled={parsedRows.filter((r) => r.status !== "INVALID").length === 0}
              className="rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-ivory hover:bg-gold-deep transition-colors disabled:opacity-50"
            >
              Start Import
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Importing progress */}
      {step === "IMPORTING" && (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
          <h3 className="font-semibold text-white">Importing Catalog Slabs...</h3>
          <div className="w-full max-w-sm bg-white/10 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gold h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${importProgress}%` }}
            ></div>
          </div>
          <span className="text-xs font-mono text-white/40">{importProgress}% completed</span>
        </div>
      )}

      {/* Step 5: Report */}
      {step === "REPORT" && (
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="rounded-full bg-emerald-500/15 p-4 mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-white text-lg">Excel Bulk Import Finished</h3>
            <p className="text-sm text-white/45 mt-1 max-w-sm">
              Your spreadsheet data has been successfully parsed and committed to the postgres catalog database.
            </p>
          </div>

          {/* Stats widgets */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-1">Created</p>
              <p className="text-2xl font-bold text-emerald-400">{importResults.created}</p>
              <span className="text-[10px] text-white/35">New SKU items</span>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-1">Updated</p>
              <p className="text-2xl font-bold text-white">{importResults.updated}</p>
              <span className="text-[10px] text-white/35">Modified rows</span>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-1">Failed</p>
              <p className="text-2xl font-bold text-red-400">{importResults.failed}</p>
              <span className="text-[10px] text-white/35">Invalid rows</span>
            </div>
          </div>

          {/* Import errors list if any */}
          {importResults.errors.length > 0 && (
            <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-4 space-y-2">
              <h4 className="text-xs font-semibold text-red-300">Detailed Import Logs & Errors</h4>
              <div className="max-h-36 overflow-y-auto space-y-1 font-mono text-[10px] text-red-200/70">
                {importResults.errors.map((err, i) => (
                  <p key={i}>{err}</p>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center pt-3">
            <button
              onClick={() => setStep("UPLOAD")}
              className="rounded-xl bg-gold px-8 py-3 text-sm font-semibold text-ivory hover:bg-gold-deep transition-colors"
            >
              Import Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
