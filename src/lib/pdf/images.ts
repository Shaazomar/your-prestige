import { getOps, resolveObject, type PdfDocumentHandle, type PdfRawImage } from "./document";

/**
 * Pulls the images the PDF actually contains — its image XObjects — rather than
 * rasterising pages and cropping them. That distinction matters: a crop of a
 * rendered page is a screenshot, capped at whatever DPI we chose to render at,
 * and usually carries slivers of neighbouring text. An XObject is the
 * photograph the brand's designer placed, at its native resolution.
 *
 * One honest caveat: pdf.js hands back *decoded* bitmaps, so what we re-encode
 * is a re-compression of the original, not a byte-for-byte copy of the embedded
 * JPEG. Lossless passthrough would need a raw PDF object parser (qpdf/mutool),
 * none of which are available here. At quality 82 the difference is invisible.
 */

export interface ExtractedImage {
  objectRef: string;
  page: number;
  width: number;
  height: number;
  /** Raw pixels, ready for sharp. */
  data: Buffer;
  channels: 1 | 3 | 4;
  /** Placement on the page in PDF user space (origin bottom-left). */
  pageX: number;
  pageY: number;
  pageW: number;
  pageH: number;
  /** Share of the page area this image covers — the page-scan signal. */
  pageCoverage: number;
}

export interface ImageExtractionResult {
  images: ExtractedImage[];
  /** Images we saw but could not decode, with the reason. */
  failures: { objectRef: string; reason: string }[];
  /** Decoded bytes handled — the budget the caller slices on. */
  bytesDecoded: number;
}

type Matrix = [number, number, number, number, number, number];

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

/** PDF matrix multiply: a then b. */
function mul(a: Matrix, b: Matrix): Matrix {
  return [
    a[0] * b[0] + a[1] * b[2],
    a[0] * b[1] + a[1] * b[3],
    a[2] * b[0] + a[3] * b[2],
    a[2] * b[1] + a[3] * b[3],
    a[4] * b[0] + a[5] * b[2] + b[4],
    a[4] * b[1] + a[5] * b[3] + b[5],
  ];
}

export async function extractPageImages(
  doc: PdfDocumentHandle,
  pageNum: number,
  opts: { maxBytes?: number; seenRefs?: Set<string> } = {}
): Promise<ImageExtractionResult> {
  const ops = await getOps();
  const page = await doc.getPage(pageNum);
  const images: ExtractedImage[] = [];
  const failures: { objectRef: string; reason: string }[] = [];
  let bytesDecoded = 0;

  try {
    const viewport = page.getViewport({ scale: 1 });
    const pageArea = viewport.width * viewport.height;
    const opList = await page.getOperatorList();

    // Walk the content stream tracking the current transformation matrix, so
    // each paint yields the image's real position and size on the page. Page
    // area is a much better hero signal than pixel dimensions — a 4000px
    // texture swatch printed at 20mm is not the hero shot.
    let ctm: Matrix = [...IDENTITY] as Matrix;
    const stack: Matrix[] = [];

    for (let i = 0; i < opList.fnArray.length; i++) {
      const fn = opList.fnArray[i];
      const args = opList.argsArray[i];

      if (fn === ops.save) {
        stack.push([...ctm] as Matrix);
        continue;
      }
      if (fn === ops.restore) {
        ctm = (stack.pop() ?? [...IDENTITY]) as Matrix;
        continue;
      }
      if (fn === ops.transform) {
        ctm = mul(args as unknown as Matrix, ctm);
        continue;
      }
      // Image masks are stencils — logos, rules, decorative cutouts. Never product art.
      if (fn === ops.paintImageMaskXObject) continue;
      if (fn !== ops.paintImageXObject) continue;

      const objectRef = String(args[0]);

      // The same XObject painted repeatedly (a tiled background, a per-page
      // logo) only needs decoding once.
      if (opts.seenRefs?.has(`${pageNum}:${objectRef}`)) continue;
      opts.seenRefs?.add(`${pageNum}:${objectRef}`);

      if (opts.maxBytes != null && bytesDecoded >= opts.maxBytes) {
        failures.push({ objectRef, reason: "byte-budget-reached" });
        continue;
      }

      const raw = await resolveObject(page, objectRef);
      if (!raw) {
        failures.push({ objectRef, reason: "unresolved" });
        continue;
      }

      const decoded = toRawBuffer(raw);
      if ("error" in decoded) {
        failures.push({ objectRef, reason: decoded.error });
        continue;
      }

      bytesDecoded += decoded.data.length;

      // The CTM maps the unit square onto the placement, so |a| and |d| are
      // the drawn width/height in user space.
      const pageW = Math.abs(ctm[0]) || Math.abs(ctm[1]) || 0;
      const pageH = Math.abs(ctm[3]) || Math.abs(ctm[2]) || 0;

      images.push({
        objectRef,
        page: pageNum,
        width: raw.width,
        height: raw.height,
        data: decoded.data,
        channels: decoded.channels,
        pageX: ctm[4],
        pageY: ctm[5],
        pageW,
        pageH,
        pageCoverage: pageArea > 0 ? (pageW * pageH) / pageArea : 0,
      });
    }
  } finally {
    // Without this a long catalogue accumulates every decoded page in memory.
    page.cleanup();
  }

  return { images, failures, bytesDecoded };
}

/**
 * Normalise pdf.js's three image kinds into something sharp accepts as `raw`.
 * The 1-bit case is the one that bites: it is packed a bit per pixel with rows
 * padded to byte boundaries, not one byte per pixel.
 */
function toRawBuffer(
  raw: PdfRawImage
): { data: Buffer; channels: 1 | 3 | 4 } | { error: string } {
  const { width, height, kind, data } = raw;

  if (!data || !width || !height) {
    // An ImageBitmap lands here when the decoder flags weren't disabled.
    return { error: raw.bitmap ? "bitmap-not-readable" : "no-pixel-data" };
  }
  if (width * height > 80_000_000) return { error: "image-too-large" };

  const bytes = Buffer.from(data.buffer, data.byteOffset, data.byteLength);

  if (kind === 1) {
    const stride = (width + 7) >> 3;
    if (bytes.length < stride * height) return { error: "truncated-1bpp" };
    const out = Buffer.alloc(width * height);
    for (let y = 0; y < height; y++) {
      const row = y * stride;
      for (let x = 0; x < width; x++) {
        const bit = (bytes[row + (x >> 3)] >> (7 - (x & 7))) & 1;
        out[y * width + x] = bit ? 255 : 0;
      }
    }
    return { data: out, channels: 1 };
  }

  const channels = kind === 3 ? 4 : 3;
  const expected = width * height * channels;

  if (bytes.length === expected) {
    return { data: bytes, channels: channels as 3 | 4 };
  }

  // Some producers pad rows. Recover the real stride and repack rather than
  // handing sharp a buffer it will misread into diagonal garbage.
  if (bytes.length > expected && bytes.length % height === 0) {
    const stride = bytes.length / height;
    const rowBytes = width * channels;
    if (stride >= rowBytes) {
      const out = Buffer.alloc(expected);
      for (let y = 0; y < height; y++) {
        bytes.copy(out, y * rowBytes, y * stride, y * stride + rowBytes);
      }
      return { data: out, channels: channels as 3 | 4 };
    }
  }

  // Most often a CMYK or JPEG2000 source pdf.js didn't convert. Surfaced in
  // the review UI rather than silently dropped.
  return {
    error: `stride-mismatch (${bytes.length} bytes for ${width}x${height}x${channels})`,
  };
}
