import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { deleteObject, headUploadedObject, objectUrlForKey } from "@/lib/media/s3-service";
import { keyBelongsTo, type MediaScope } from "@/lib/media/keys";

/**
 * The database half of the media pipeline: CMS → S3 → **Media row** → site.
 *
 * Direct-to-S3 uploads used to stop at S3. Only the server-side
 * `/api/admin/media` route ever created a `Media` row, so every image uploaded
 * through a presigned URL — which is every image, whenever S3 is configured —
 * existed in the bucket and nowhere in the database. The media library
 * couldn't list it, nothing recorded who uploaded it or how big it was, and an
 * orphaned object could never be identified. `completeUpload` closes that.
 */

export interface CompleteUploadInput {
  key: string;
  scope: MediaScope;
  ownerId?: string | null;
  filename: string;
  contentType: string;
  uploadedById?: string | null;
}

export interface CompletedMedia {
  id: string;
  url: string;
  key: string;
  size: number;
}

export class MediaError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "MediaError";
    this.status = status;
  }
}

/**
 * Register an object that has just been PUT to S3.
 *
 * The HEAD is not a formality. The browser's `fetch` resolving with a 2xx is
 * the only other evidence we have, and a proxy, a cancelled request or an
 * expired signature can all produce a response that looks fine from the
 * client. Verifying against the bucket is what makes "saved" mean saved.
 */
export async function completeUpload(input: CompleteUploadInput): Promise<CompletedMedia> {
  const head = await headUploadedObject(input.key);
  if (!head.exists) {
    throw new MediaError(
      "The upload did not arrive in storage. Please retry — if it keeps failing, the bucket's CORS rules or upload permissions need attention.",
      422
    );
  }

  const url = objectUrlForKey(input.key);

  const media = await prisma.media.create({
    data: {
      url,
      publicId: input.key,
      filename: input.filename,
      mimeType: head.contentType || input.contentType,
      size: head.size ?? 0,
      uploadedById: input.uploadedById ?? undefined,
    },
  });

  await logAudit({
    action: "media.upload",
    entity: "Media",
    entityId: media.id,
    newValue: { url, key: input.key, scope: input.scope, ownerId: input.ownerId ?? null },
  });

  return { id: media.id, url, key: input.key, size: head.size ?? 0 };
}

/**
 * Remove a media object, but only one this record is allowed to remove.
 *
 * Two guards, both about not destroying media that something else still
 * points at:
 *
 *  - the key must live under this scope and owner, so editing one product can
 *    never delete another record's file;
 *  - the object is only deleted once no other `Media` row references the same
 *    URL, because the same asset can legitimately be attached in several
 *    places and the last pointer is not the only pointer.
 *
 * Callers must have already persisted the replacement. See `README` note in
 * `s3-service.deleteObject`.
 */
export async function deleteOwnedMedia(opts: {
  key: string;
  scope: MediaScope;
  ownerId: string;
}): Promise<{ deleted: boolean; reason?: string }> {
  if (!keyBelongsTo(opts.key, opts.scope, opts.ownerId)) {
    throw new MediaError(
      "That file does not belong to this record, so it was not deleted.",
      403
    );
  }

  const url = objectUrlForKey(opts.key);
  const rows = await prisma.media.findMany({
    where: { url, deletedAt: null },
    select: { id: true },
  });

  const stillReferenced = await isUrlReferencedElsewhere(url);
  if (stillReferenced) {
    return { deleted: false, reason: "in-use" };
  }

  // Soft-delete the rows first: if the S3 delete then fails, the database is
  // still consistent and the object is merely orphaned, which is recoverable.
  // The reverse order loses the file while the CMS still advertises it.
  if (rows.length > 0) {
    await prisma.media.updateMany({
      where: { id: { in: rows.map((r) => r.id) } },
      data: { deletedAt: new Date() },
    });
  }

  await deleteObject(opts.key);
  await logAudit({ action: "media.delete", entity: "Media", entityId: opts.key, oldValue: { url } });
  return { deleted: true };
}

/**
 * Is this URL still attached to a published record anywhere?
 *
 * Shared media is real: one lifestyle photograph is often a product's hero and
 * a homepage panel at the same time. Deleting the object because one of the
 * two stopped using it would break the other, so every column that can hold a
 * media URL is checked before the bytes go.
 */
export async function isUrlReferencedElsewhere(url: string): Promise<boolean> {
  const [product, brand, category, collection] = await Promise.all([
    prisma.product.count({
      where: {
        deletedAt: null,
        OR: [{ lifestyleImage: url }, { textureImage: url }],
      },
    }),
    prisma.brand.count({
      where: {
        deletedAt: null,
        OR: [
          { logo: url }, { banner: url }, { mobileCoverImage: url },
          { heroVideo: url }, { heroPoster: url },
        ],
      },
    }),
    prisma.category.count({
      where: { deletedAt: null, OR: [{ image: url }, { bannerImage: url }] },
    }),
    prisma.collection.count({ where: { deletedAt: null, image: url } }),
  ]);

  if (product + brand + category + collection > 0) return true;

  // `Product.images` and `Brand.gallery` are Json arrays, so they need a
  // containment test rather than an equality one.
  const [inProductGallery, inBrandGallery] = await Promise.all([
    prisma.product.count({ where: { deletedAt: null, images: { array_contains: url } } }),
    prisma.brand.count({ where: { deletedAt: null, gallery: { array_contains: url } } }),
  ]);
  return inProductGallery + inBrandGallery > 0;
}
