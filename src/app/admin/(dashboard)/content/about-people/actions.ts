"use server";

import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { uploadBufferToS3, deleteS3Object } from "@/lib/s3";

import { Prisma } from "@prisma/client";

export interface AboutPersonInput {
  name: string;
  designation: string;
  description?: string | null;
  eyebrow?: string | null;
  image: string;
  imageKey?: string | null;
  imageAlt?: string | null;
  type?: string;
  date?: string | null;
  location?: string | null;
  displayOrder?: number;
  active?: boolean;
}

export async function listAboutPeople(params?: {
  search?: string;
  type?: string;
  activeOnly?: boolean;
}) {
  await requirePermission("aboutPeople", "view");

  const where: Prisma.AboutPersonWhereInput = {
    deletedAt: null,
  };

  if (params?.activeOnly) {
    where.active = true;
  }

  if (params?.type && params.type !== "ALL") {
    where.type = params.type;
  }

  if (params?.search?.trim()) {
    where.OR = [
      { name: { contains: params.search.trim(), mode: "insensitive" } },
      { designation: { contains: params.search.trim(), mode: "insensitive" } },
      { description: { contains: params.search.trim(), mode: "insensitive" } },
    ];
  }

  const people = await prisma.aboutPerson.findMany({
    where,
    orderBy: [
      { displayOrder: "asc" },
      { createdAt: "asc" },
    ],
  });

  // If table is completely empty, seed the initial Inauguration entry for U. T. Khader
  if (people.length === 0) {
    await seedInitialInauguration();
    return prisma.aboutPerson.findMany({
      where,
      orderBy: [
        { displayOrder: "asc" },
        { createdAt: "asc" },
      ],
    });
  }

  return people;
}

export async function seedInitialInauguration() {
  try {
    const existing = await prisma.aboutPerson.findFirst({
      where: {
        OR: [
          { name: "U. T. Khader", deletedAt: null },
          { type: "INAUGURATION", deletedAt: null },
          { eyebrow: "INAUGURATED BY", deletedAt: null }
        ]
      },
    });

    if (existing) {
      const updated = await prisma.aboutPerson.update({
        where: { id: existing.id },
        data: {
          name: "U. T. Khader",
          eyebrow: "INAUGURATED BY",
          designation: "Minister of Health and Family Welfare of Karnataka",
          type: "INAUGURATION",
          imageAlt: "U. T. Khader at Prestige Tiles inauguration",
        },
      });
      return updated;
    }

    const localImagePath = path.join(process.cwd(), "public", "about", "imaugratedbyUT.jpeg");
    let imageUrl = "/about/imaugratedbyUT.jpeg";
    let imageKey: string | null = null;

    if (fs.existsSync(localImagePath)) {
      const buffer = fs.readFileSync(localImagePath);
      const s3Res = await uploadBufferToS3(buffer, "imaugratedbyUT.jpeg", "image/jpeg", "about");
      imageUrl = s3Res.url;
      imageKey = s3Res.key;
    }

    const seeded = await prisma.aboutPerson.create({
      data: {
        name: "U. T. Khader",
        designation: "Minister of Health and Family Welfare of Karnataka",
        description: null,
        eyebrow: "INAUGURATED BY",
        image: imageUrl,
        imageKey: imageKey,
        imageAlt: "U. T. Khader at Prestige Tiles inauguration",
        type: "INAUGURATION",
        displayOrder: 0,
        active: true,
      },
    });

    revalidatePath("/about");
    return seeded;
  } catch (err) {
    console.error("Failed to seed initial inauguration record:", err);
    return null;
  }
}

export async function getAboutPerson(id: string) {
  await requirePermission("aboutPeople", "view");
  return prisma.aboutPerson.findUnique({
    where: { id },
  });
}

export async function createAboutPerson(input: AboutPersonInput) {
  const session = await requirePermission("aboutPeople", "create");

  if (!input.name?.trim()) throw new Error("Name is required");
  if (!input.image?.trim()) throw new Error("Image is required");

  const count = await prisma.aboutPerson.count({ where: { deletedAt: null } });

  const person = await prisma.aboutPerson.create({
    data: {
      name: input.name.trim(),
      designation: input.designation?.trim() || "",
      description: input.description?.trim() || null,
      eyebrow: input.eyebrow?.trim() || null,
      image: input.image,
      imageKey: input.imageKey || null,
      imageAlt: input.imageAlt?.trim() || `${input.name} - ${input.designation}`,
      type: input.type || "Inauguration",
      date: input.date?.trim() || null,
      location: input.location?.trim() || null,
      displayOrder: input.displayOrder ?? count,
      active: input.active ?? true,
      createdById: session.user.id,
    },
  });

  await logAudit({
    action: "aboutPerson.create",
    entity: "AboutPerson",
    entityId: person.id,
    newValue: person,
  });

  revalidatePath("/about");
  revalidatePath("/admin/content/about-people");
  return person;
}

export async function updateAboutPerson(id: string, input: AboutPersonInput) {
  const session = await requirePermission("aboutPeople", "edit");

  const existing = await prisma.aboutPerson.findUnique({ where: { id } });
  if (!existing) throw new Error("Person record not found");

  if (!input.name?.trim()) throw new Error("Name is required");
  if (!input.image?.trim()) throw new Error("Image is required");

  // If image was replaced and old key exists and differs, attempt safe cleanup
  if (existing.imageKey && input.imageKey && existing.imageKey !== input.imageKey) {
    deleteS3Object(existing.imageKey).catch((e) => console.warn("Old S3 cleanup skipped:", e));
  }

  const updated = await prisma.aboutPerson.update({
    where: { id },
    data: {
      name: input.name.trim(),
      designation: input.designation?.trim() || "",
      description: input.description?.trim() || null,
      eyebrow: input.eyebrow?.trim() || null,
      image: input.image,
      imageKey: input.imageKey ?? existing.imageKey,
      imageAlt: input.imageAlt?.trim() || `${input.name} - ${input.designation}`,
      type: input.type || existing.type,
      date: input.date?.trim() || null,
      location: input.location?.trim() || null,
      displayOrder: input.displayOrder ?? existing.displayOrder,
      active: input.active ?? existing.active,
      updatedById: session.user.id,
    },
  });

  await logAudit({
    action: "aboutPerson.update",
    entity: "AboutPerson",
    entityId: updated.id,
    oldValue: existing,
    newValue: updated,
  });

  revalidatePath("/about");
  revalidatePath("/admin/content/about-people");
  return updated;
}

export async function toggleActiveAboutPerson(id: string) {
  const session = await requirePermission("aboutPeople", "edit");

  const existing = await prisma.aboutPerson.findUnique({ where: { id } });
  if (!existing) throw new Error("Record not found");

  const updated = await prisma.aboutPerson.update({
    where: { id },
    data: {
      active: !existing.active,
      updatedById: session.user.id,
    },
  });

  await logAudit({
    action: "aboutPerson.toggleActive",
    entity: "AboutPerson",
    entityId: updated.id,
    newValue: { active: updated.active },
  });

  revalidatePath("/about");
  revalidatePath("/admin/content/about-people");
  return updated;
}

export async function deleteAboutPerson(id: string) {
  const session = await requirePermission("aboutPeople", "delete");

  const existing = await prisma.aboutPerson.findUnique({ where: { id } });
  if (!existing) throw new Error("Record not found");

  const deleted = await prisma.aboutPerson.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      updatedById: session.user.id,
    },
  });

  await logAudit({
    action: "aboutPerson.delete",
    entity: "AboutPerson",
    entityId: id,
    oldValue: existing,
  });

  revalidatePath("/about");
  revalidatePath("/admin/content/about-people");
  return deleted;
}

export async function reorderAboutPeople(id: string, direction: "up" | "down") {
  await requirePermission("aboutPeople", "edit");

  const all = await prisma.aboutPerson.findMany({
    where: { deletedAt: null },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });

  const index = all.findIndex((item) => item.id === id);
  if (index === -1) return;

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= all.length) return;

  const current = all[index];
  const target = all[targetIndex];

  await prisma.$transaction([
    prisma.aboutPerson.update({
      where: { id: current.id },
      data: { displayOrder: target.displayOrder },
    }),
    prisma.aboutPerson.update({
      where: { id: target.id },
      data: { displayOrder: current.displayOrder },
    }),
  ]);

  revalidatePath("/about");
  revalidatePath("/admin/content/about-people");
}
