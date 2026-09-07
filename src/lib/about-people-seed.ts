import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { uploadBufferToS3 } from "@/lib/s3";

/**
 * Creates the launch "INAUGURATED BY" record if — and only if — the About
 * people table holds nothing at all.
 *
 * Deliberately not a Server Action and not called from page render:
 *  - as an exported action it was callable by anyone, unauthenticated, since
 *    the public /about page shipped its action id to the browser;
 *  - called during /about's render it wrote to the database on every page
 *    view, and its revalidatePath() throw was swallowed by the catch;
 *  - it used to *update* whatever record it found, silently reverting an
 *    admin's edits to that person's name and designation.
 *
 * Returns the created row, or null when there was nothing to do.
 */
export async function ensureInaugurationRecord() {
  const existingCount = await prisma.aboutPerson.count();
  if (existingCount > 0) return null;

  const localImagePath = path.join(process.cwd(), "public", "about", "imaugratedbyUT.jpeg");
  let imageUrl = "/about/imaugratedbyUT.jpeg";
  let imageKey: string | null = null;

  if (fs.existsSync(localImagePath)) {
    const buffer = fs.readFileSync(localImagePath);
    const s3Res = await uploadBufferToS3(buffer, "imaugratedbyUT.jpeg", "image/jpeg", "about");
    imageUrl = s3Res.url;
    imageKey = s3Res.key;
  }

  return prisma.aboutPerson.create({
    data: {
      name: "U. T. Khader",
      designation: "Minister of Health and Family Welfare of Karnataka",
      description: null,
      eyebrow: "INAUGURATED BY",
      image: imageUrl,
      imageKey,
      imageAlt: "U. T. Khader at Prestige Tiles inauguration",
      type: "INAUGURATION",
      displayOrder: 0,
      active: true,
    },
  });
}
