"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { homepageHeroSchema, defaultHomepageHero, type HomepageHeroInput } from "./schema";

export async function getHomepageDraft(): Promise<HomepageHeroInput> {
  await requirePermission("homepage", "view");
  const row = await prisma.setting.findUnique({ where: { key: "homepage.hero.draft" } });
  return row ? { ...defaultHomepageHero, ...(row.value as object) } : defaultHomepageHero;
}

export async function isHomepagePublished(): Promise<boolean> {
  await requirePermission("homepage", "view");
  const [draft, published] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "homepage.hero.draft" } }),
    prisma.setting.findUnique({ where: { key: "homepage.hero.published" } }),
  ]);
  if (!published) return false;
  return JSON.stringify(draft?.value ?? {}) === JSON.stringify(published.value);
}

export async function saveHomepageDraft(input: HomepageHeroInput) {
  const session = await requirePermission("homepage", "edit");
  const data = homepageHeroSchema.parse(input);
  await prisma.setting.upsert({
    where: { key: "homepage.hero.draft" },
    create: { key: "homepage.hero.draft", value: data },
    update: { value: data },
  });
  await logAudit({ action: "homepage.save_draft", entity: "Setting", newValue: data, meta: { by: session.user.id } });
  revalidatePath("/");
  revalidatePath("/?preview=1");
  return data;
}

export async function publishHomepage() {
  const session = await requirePermission("homepage", "publish");
  const draft = await prisma.setting.findUnique({ where: { key: "homepage.hero.draft" } });
  const value = draft?.value ?? defaultHomepageHero;
  await prisma.setting.upsert({
    where: { key: "homepage.hero.published" },
    create: { key: "homepage.hero.published", value },
    update: { value },
  });
  await logAudit({ action: "homepage.publish", entity: "Setting", newValue: value, meta: { by: session.user.id } });
  revalidatePath("/");
  revalidatePath("/?preview=1");
}

/** Read by the public homepage — falls back to defaults if nothing published yet. */
export async function getPublishedHomepageHero(): Promise<HomepageHeroInput> {
  const row = await prisma.setting.findUnique({ where: { key: "homepage.hero.published" } });
  return row ? { ...defaultHomepageHero, ...(row.value as object) } : defaultHomepageHero;
}
