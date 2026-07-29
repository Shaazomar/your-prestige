
/**
 * pdf.js access, wrapped so the rest of the codebase never has to remember its
 * sharp edges:
 *
 * - It must be imported dynamically from the `legacy` build. The default build
 *   assumes a browser (DOM, workers, canvas) and will not load under Node.
 * - `isOffscreenCanvasSupported` and `isImageDecoderSupported` must both be
 *   false. Left on, pdf.js hands back an `ImageBitmap` whose pixels cannot be
 *   read outside a canvas — image extraction silently yields nothing.
 * - The thing you destroy is the *loading task*, not the document proxy.
 *   `doc.destroy` does not exist, and skipping the destroy leaks the worker.
 */

// pdf.js has no bundled types we can rely on across builds; these are the
// narrow slices this codebase actually touches.
export interface PdfTextItem {
  str: string;
  transform: number[]; // [a, b, c, d, e, f] — e/f are x/y in user space
  width: number;
  height: number;
  hasEOL?: boolean;
}

export interface PdfRawImage {
  width: number;
  height: number;
  /** 1 = GRAYSCALE_1BPP, 2 = RGB_24BPP, 3 = RGBA_32BPP */
  kind?: number;
  data?: Uint8Array | Uint8ClampedArray | null;
  bitmap?: unknown;
}

export interface PdfPage {
  getTextContent(): Promise<{ items: PdfTextItem[] }>;
  getOperatorList(): Promise<{ fnArray: number[]; argsArray: unknown[][] }>;
  getViewport(opts: { scale: number }): { width: number; height: number };
  objs: { get(name: string, cb: (v: PdfRawImage) => void): void };
  commonObjs: { get(name: string, cb: (v: PdfRawImage) => void): void };
  cleanup(): void;
}

export interface PdfDocumentHandle {
  numPages: number;
  getPage(n: number): Promise<PdfPage>;
  /** Always call this — it tears down the worker. */
  close(): Promise<void>;
}

export interface PdfOps {
  paintImageXObject: number;
  paintInlineImageXObject: number;
  paintImageMaskXObject: number;
  save: number;
  restore: number;
  transform: number;
}

let opsCache: PdfOps | null = null;

async function loadPdfjs() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await import("pdfjs-dist/legacy/build/pdf.mjs")) as any;
}

export async function getOps(): Promise<PdfOps> {
  if (opsCache) return opsCache;
  const pdfjs = await loadPdfjs();
  opsCache = {
    paintImageXObject: pdfjs.OPS.paintImageXObject,
    paintInlineImageXObject: pdfjs.OPS.paintInlineImageXObject,
    paintImageMaskXObject: pdfjs.OPS.paintImageMaskXObject,
    save: pdfjs.OPS.save,
    restore: pdfjs.OPS.restore,
    transform: pdfjs.OPS.transform,
  };
  return opsCache;
}

export async function openPdf(data: Uint8Array): Promise<PdfDocumentHandle> {
  const pdfjs = await loadPdfjs();
  const task = pdfjs.getDocument({
    data,
    isOffscreenCanvasSupported: false, // ← without these two, image data is unreadable
    isImageDecoderSupported: false,
    disableFontFace: true,
    useSystemFonts: false,
    // Catalogue PDFs are frequently linearised with broken xref tables.
    stopAtErrors: false,
  });
  const doc = await task.promise;

  return {
    numPages: doc.numPages,
    getPage: (n: number) => doc.getPage(n),
    close: async () => {
      try {
        await task.destroy();
      } catch {
        // A destroy failure must never mask the real error from a slice.
      }
    },
  };
}

/**
 * Resolve a pdf.js object by name.
 *
 * Objects live in one of two registries and picking the wrong one doesn't
 * error — the callback simply never fires, so a naive implementation stalls
 * until its timeout on every shared object. Names prefixed `g_` are global
 * (an image reused across pages, like a masthead) and live on `commonObjs`;
 * everything else is page-local. We register on both and take whichever
 * answers, since the prefix convention isn't guaranteed across producers.
 */
export function resolveObject(
  page: PdfPage,
  name: string,
  timeoutMs = 5000
): Promise<PdfRawImage | null> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (v: PdfRawImage | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(v);
    };

    const timer = setTimeout(() => finish(null), timeoutMs);

    // Global objects first when the name says so — it's the common case for
    // per-page furniture and avoids waiting on the page registry.
    const registries = name.startsWith("g_")
      ? [page.commonObjs, page.objs]
      : [page.objs, page.commonObjs];

    for (const registry of registries) {
      try {
        registry.get(name, (v) => finish(v ?? null));
      } catch {
        // Registry rejected the name outright; the other one may still answer.
      }
    }
  });
}
