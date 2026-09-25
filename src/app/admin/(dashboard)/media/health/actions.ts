"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import {
  collectMediaIssues, summarize, verifyMediaUrl, verifyBrandImages,
  type MediaIssue, type MediaHealthStats, type BrandImageCheckPage,
} from "@/lib/media/health-check";
import { PUBLIC_PRODUCT_WHERE } from "@/lib/products";

export async function scanMediaHealth(): Promise<{ issues: MediaIssue[]; stats: MediaHealthStats }> {
  await requirePermission("media", "view");
  const issues = await collectMediaIssues();
  return { issues, stats: summarize(issues) };
}

export async function verifyMediaHealthUrl(url: string) {
  await requirePermission("media", "view");
  return verifyMediaUrl(url);
}

/** Published brands with a product count, for the "verify this brand's photography" picker. */
export async function listBrandsForImageCheck(): Promise<{ slug: string; name: string; productCount: number }[]> {
  await requirePermission("media", "view");
  const rows = await prisma.brand.findMany({
    where: { published: true, deletedAt: null },
    select: { slug: true, name: true, _count: { select: { products: { where: PUBLIC_PRODUCT_WHERE } } } },
    orderBy: { name: "asc" },
  });
  return rows
    .map((r) => ({ slug: r.slug, name: r.name, productCount: r._count.products }))
    .filter((r) => r.productCount > 0);
}

const IMAGE_CHECK_BATCH = 40;

/** One page of a brand's live image verification — see `verifyBrandImages`. */
export async function checkBrandImages(brandSlug: string, offset: number): Promise<BrandImageCheckPage> {
  await requirePermission("media", "view");
  return verifyBrandImages(brandSlug, offset, IMAGE_CHECK_BATCH);
}

/**
 * Field-level allowlist for repair. Deliberately narrow: only scalar,
 * single-image fields that a replacement URL can unambiguously replace.
 * Gallery/array entries (`images[2]`, `gallery[0]`, ...) are surfaced as
 * read-only in the report — editing one element of a JSON array safely
 * needs the record's own editor, not a generic "paste a URL here" box.
 */
export async function repairMediaField(entity: MediaIssue["entity"], entityId: string, field: string, newUrl: string) {
  const session = await requirePermission("media", "edit");

  const value = newUrl.trim();
  if (!value) throw new Error("Enter a replacement URL.");
  if (!/^https?:\/\//i.test(value) && !value.startsWith("/")) {
    throw new Error("The replacement must be an absolute URL or a site-relative path.");
  }

  let before: Record<string, unknown>;

  switch (`${entity}:${field}`) {
    case "Product:lifestyleImage":
      before = await prisma.product.findUniqueOrThrow({ where: { id: entityId }, select: { lifestyleImage: true } });
      await prisma.product.update({ where: { id: entityId }, data: { lifestyleImage: value } });
      break;
    case "Product:textureImage":
      before = await prisma.product.findUniqueOrThrow({ where: { id: entityId }, select: { textureImage: true } });
      await prisma.product.update({ where: { id: entityId }, data: { textureImage: value } });
      break;
    case "Brand:logo":
      before = await prisma.brand.findUniqueOrThrow({ where: { id: entityId }, select: { logo: true } });
      await prisma.brand.update({ where: { id: entityId }, data: { logo: value } });
      break;
    case "Brand:banner":
      before = await prisma.brand.findUniqueOrThrow({ where: { id: entityId }, select: { banner: true } });
      await prisma.brand.update({ where: { id: entityId }, data: { banner: value } });
      break;
    case "Brand:mobileCoverImage":
      before = await prisma.brand.findUniqueOrThrow({ where: { id: entityId }, select: { mobileCoverImage: true } });
      await prisma.brand.update({ where: { id: entityId }, data: { mobileCoverImage: value } });
      break;
    case "Brand:heroPoster":
      before = await prisma.brand.findUniqueOrThrow({ where: { id: entityId }, select: { heroPoster: true } });
      await prisma.brand.update({ where: { id: entityId }, data: { heroPoster: value } });
      break;
    case "Category:image":
      before = await prisma.category.findUniqueOrThrow({ where: { id: entityId }, select: { image: true } });
      await prisma.category.update({ where: { id: entityId }, data: { image: value } });
      break;
    case "Category:bannerImage":
      before = await prisma.category.findUniqueOrThrow({ where: { id: entityId }, select: { bannerImage: true } });
      await prisma.category.update({ where: { id: entityId }, data: { bannerImage: value } });
      break;
    case "Collection:image":
      before = await prisma.collection.findUniqueOrThrow({ where: { id: entityId }, select: { image: true } });
      await prisma.collection.update({ where: { id: entityId }, data: { image: value } });
      break;
    case "Showroom:heroImage":
      before = await prisma.showroom.findUniqueOrThrow({ where: { id: entityId }, select: { heroImage: true } });
      await prisma.showroom.update({ where: { id: entityId }, data: { heroImage: value } });
      break;
    case "AboutPerson:image":
      before = await prisma.aboutPerson.findUniqueOrThrow({ where: { id: entityId }, select: { image: true } });
      await prisma.aboutPerson.update({ where: { id: entityId }, data: { image: value } });
      break;
    default:
      throw new Error("This field can't be repaired from here.");
  }

  await logAudit({
    action: "media.repair",
    entity,
    entityId,
    oldValue: before,
    newValue: { [field]: value },
    meta: { by: session.user.id, field },
  });

  return { ok: true };
}
