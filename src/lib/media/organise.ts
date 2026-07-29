import { prisma } from "@/lib/prisma";

/**
 * Files an imported image into the Media library under a
 * Catalog / Brand / Collection folder path.
 *
 * Images are registered here at *publish* time rather than at extraction.
 * A catalogue import produces far more candidates than survive review, and
 * filling the library with rejected crops would make it useless. What reaches
 * the library is what reached the website.
 */

const ROOT = "Catalog";

/** Resolve (creating as needed) a nested folder path, returning the leaf id. */
export async function ensureFolderPath(segments: string[]): Promise<string | null> {
  const clean = segments
    .map((s) => s?.trim())
    .filter((s): s is string => !!s && s.length > 0)
    .map((s) => s.slice(0, 60));

  if (clean.length === 0) return null;

  let parentId: string | null = null;
  for (const name of clean) {
    // No unique constraint on (name, parentId), so find-then-create. Imports
    // are single-threaded per slice, and a duplicate folder is cosmetic
    // rather than corrupting — not worth a schema migration to prevent.
    const existing: { id: string } | null = await prisma.mediaFolder.findFirst({
      where: { name, parentId },
      select: { id: true },
    });
    parentId = existing
      ? existing.id
      : (await prisma.mediaFolder.create({ data: { name, parentId }, select: { id: true } })).id;
  }
  return parentId;
}

export interface RegisterMediaInput {
  url: string;
  filename: string;
  width?: number | null;
  height?: number | null;
  bytes?: number | null;
  altText?: string | null;
  brand?: string | null;
  collection?: string | null;
  productName?: string | null;
  uploadedById?: string | null;
  tags?: string[];
}

/**
 * Create the Media row for a published image, filed under
 * Catalog / <Brand> / <Collection>. Returns the row id, or the existing one if
 * this URL is already in the library — publishing twice must not duplicate it.
 */
export async function registerMedia(input: RegisterMediaInput): Promise<string | null> {
  if (!input.url) return null;

  const existing = await prisma.media.findFirst({
    where: { url: input.url, deletedAt: null },
    select: { id: true },
  });
  if (existing) return existing.id;

  const folderId = await ensureFolderPath([ROOT, input.brand ?? "Unsorted", input.collection ?? ""]);

  const media = await prisma.media.create({
    data: {
      url: input.url,
      filename: input.filename,
      mimeType: guessMime(input.filename),
      size: input.bytes ?? 0,
      width: input.width ?? null,
      height: input.height ?? null,
      altText: input.altText ?? null,
      tags: [
        ...(input.tags ?? []),
        ...[input.brand, input.collection, input.productName].filter((t): t is string => !!t),
      ],
      folderId,
      uploadedById: input.uploadedById ?? null,
    },
    select: { id: true },
  });
  return media.id;
}

function guessMime(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "webp": return "image/webp";
    case "avif": return "image/avif";
    case "png": return "image/png";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "pdf": return "application/pdf";
    default: return "application/octet-stream";
  }
}

/**
 * Is this URL referenced anywhere?
 *
 * The original usage check only looked at a handful of scalar columns, which
 * meant every gallery image — all of which live in `Json` arrays — looked
 * unused and was safe to delete. That's a data-loss trap, so the array columns
 * are checked too, via a containment query on the JSONB.
 */
export async function findMediaUsage(url: string): Promise<string[]> {
  const used: string[] = [];
  const jsonHas = { array_contains: url };

  const [product, brand, category, project, gallery, showroom, landing, post] = await Promise.all([
    prisma.product.findFirst({
      where: {
        deletedAt: null,
        OR: [{ lifestyleImage: url }, { textureImage: url }, { images: jsonHas }],
      },
      select: { name: true },
    }),
    prisma.brand.findFirst({
      where: { deletedAt: null, OR: [{ logo: url }, { banner: url }, { gallery: jsonHas }] },
      select: { name: true },
    }),
    prisma.category.findFirst({ where: { deletedAt: null, image: url }, select: { name: true } }),
    prisma.project.findFirst({ where: { deletedAt: null, images: jsonHas }, select: { title: true } }),
    prisma.galleryItem.findFirst({ where: { deletedAt: null, url }, select: { id: true } }),
    prisma.showroom.findFirst({
      where: { deletedAt: null, OR: [{ heroImage: url }, { gallery: jsonHas }, { googlePhotos: jsonHas }] },
      select: { name: true },
    }),
    prisma.landingPage.findFirst({
      where: { deletedAt: null, OR: [{ heroImage: url }, { gallery: jsonHas }] },
      select: { title: true },
    }),
    prisma.post.findFirst({ where: { deletedAt: null, coverImage: url }, select: { title: true } }),
  ]);

  if (product) used.push(`Product: ${product.name}`);
  if (brand) used.push(`Brand: ${brand.name}`);
  if (category) used.push(`Category: ${category.name}`);
  if (project) used.push(`Portfolio: ${project.title}`);
  if (gallery) used.push("Gallery");
  if (showroom) used.push(`Showroom: ${showroom.name}`);
  if (landing) used.push(`Landing page: ${landing.title}`);
  if (post) used.push(`Blog: ${post.title}`);

  return used;
}

/**
 * Library files nothing references. Scanned in batches because a catalogue
 * import can add thousands of rows, and each one costs eight queries.
 */
export async function findUnusedMedia(limit = 200): Promise<
  { id: string; url: string; filename: string; size: number; createdAt: Date }[]
> {
  const candidates = await prisma.media.findMany({
    where: { deletedAt: null },
    select: { id: true, url: true, filename: true, size: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const unused: typeof candidates = [];
  for (const media of candidates) {
    const usage = await findMediaUsage(media.url);
    if (usage.length === 0) unused.push(media);
  }
  return unused;
}
