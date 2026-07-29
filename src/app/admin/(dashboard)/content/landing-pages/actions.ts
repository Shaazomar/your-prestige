"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import type { ListParams, ListResult } from "@/hooks/useAdminList";
import { landingPageSchema, type LandingPageInput } from "./schema";
import type { LandingPage, Prisma } from "@prisma/client";

export type LandingPageRow = LandingPage;

/** Landing pages are ISR'd at root URLs; bust the page and the sitemap. */
function revalidateLanding(slug?: string) {
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/${slug}`);
}

export async function listLandingPages(params: ListParams): Promise<ListResult<LandingPageRow>> {
  await requirePermission("landingPages", "view");

  const where: Prisma.LandingPageWhereInput = {
    deletedAt: params.trash ? { not: null } : null,
    ...(params.search
      ? {
          OR: [
            { title: { contains: params.search, mode: "insensitive" } },
            { slug: { contains: params.search, mode: "insensitive" } },
            { city: { contains: params.search, mode: "insensitive" } },
            { serviceType: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.landingPage.findMany({
      where,
      orderBy: { [params.sortBy]: params.sortDir },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.landingPage.count({ where }),
  ]);

  return { rows, total };
}

function toData(data: LandingPageInput) {
  return {
    kind: data.kind,
    title: data.title,
    heading: data.heading,
    subheading: data.subheading || null,
    intro: data.intro || null,
    blocks: data.blocks as unknown as Prisma.InputJsonValue,
    city: data.city || null,
    locality: data.locality || null,
    areaServed: data.areaServed as unknown as Prisma.InputJsonValue,
    serviceType: data.serviceType || null,
    heroImage: data.heroImage || null,
    gallery: data.gallery as unknown as Prisma.InputJsonValue,
    faqs: data.faqs as unknown as Prisma.InputJsonValue,
    showroomIds: data.showroomIds as unknown as Prisma.InputJsonValue,
    featuredProductIds: data.featuredProductIds as unknown as Prisma.InputJsonValue,
    published: data.published,
    sortOrder: data.sortOrder,
  };
}

export async function createLandingPage(input: LandingPageInput) {
  const session = await requirePermission("landingPages", "create");
  const data = landingPageSchema.parse(input);

  const clash = await prisma.landingPage.findUnique({ where: { slug: data.slug } });
  if (clash) throw new Error("A landing page with this slug already exists.");

  const created = await prisma.landingPage.create({
    data: { slug: data.slug, ...toData(data), createdById: session.user.id },
  });

  await logAudit({
    action: "landing_page.create",
    entity: "LandingPage",
    entityId: created.id,
    newValue: { slug: created.slug, title: created.title },
  });
  revalidateLanding(created.slug);
  return created;
}

export async function updateLandingPage(id: string, input: LandingPageInput) {
  const session = await requirePermission("landingPages", "edit");
  const data = landingPageSchema.parse(input);
  const before = await prisma.landingPage.findUniqueOrThrow({ where: { id } });

  const clash = await prisma.landingPage.findFirst({
    where: { slug: data.slug, id: { not: id } },
  });
  if (clash) throw new Error("A landing page with this slug already exists.");

  const after = await prisma.landingPage.update({
    where: { id },
    data: { slug: data.slug, ...toData(data), updatedById: session.user.id },
  });

  await logAudit({
    action: "landing_page.update",
    entity: "LandingPage",
    entityId: id,
    oldValue: { slug: before.slug, title: before.title },
    newValue: { slug: after.slug, title: after.title },
  });

  revalidateLanding(after.slug);
  if (before.slug !== after.slug) revalidateLanding(before.slug);
  return after;
}

export async function softDeleteLandingPage(id: string) {
  const session = await requirePermission("landingPages", "delete");
  const row = await prisma.landingPage.update({
    where: { id },
    data: { deletedAt: new Date(), deletedById: session.user.id },
  });
  await logAudit({ action: "landing_page.delete", entity: "LandingPage", entityId: id });
  revalidateLanding(row.slug);
}

export async function restoreLandingPage(id: string) {
  await requirePermission("landingPages", "edit");
  const row = await prisma.landingPage.update({
    where: { id },
    data: { deletedAt: null, deletedById: null },
  });
  await logAudit({ action: "landing_page.restore", entity: "LandingPage", entityId: id });
  revalidateLanding(row.slug);
}

export async function getLandingPageOptions() {
  await requirePermission("landingPages", "view");
  const [showrooms, brands] = await Promise.all([
    prisma.showroom.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, city: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.brand.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { showrooms, brands };
}
