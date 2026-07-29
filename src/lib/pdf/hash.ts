import { createHash } from "crypto";
import sharp from "sharp";

/**
 * Two hashes, doing two different jobs.
 *
 * `contentHash` is an exact digest of the decoded pixels. It backs the
 * `@@unique([importId, contentHash])` constraint, which is what makes an
 * IMAGING slice safe to retry — re-processing a page inserts nothing new.
 *
 * `dHash` is perceptual. It catches the same photograph saved at a different
 * size or quality, which exact hashing misses entirely: the logo re-exported
 * per page, a product shot reused across a brand's catalogues, or a hero image
 * that also appears cropped in a collection spread.
 */

export function contentHash(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

/**
 * 64-bit difference hash. Downscale to 9x8 greyscale, then record whether each
 * pixel is brighter than its right-hand neighbour. Insensitive to scale,
 * compression and mild colour shifts; sensitive to actual composition.
 */
export async function dHash(
  data: Buffer,
  width: number,
  height: number,
  channels: 1 | 3 | 4
): Promise<string> {
  const px = await sharp(data, { raw: { width, height, channels } })
    .resize(9, 8, { fit: "fill" })
    .greyscale()
    .raw()
    .toBuffer();

  const bits: number[] = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      bits.push(px[y * 9 + x] > px[y * 9 + x + 1] ? 1 : 0);
    }
  }
  let hex = "";
  for (let i = 0; i < 64; i += 4) {
    hex += ((bits[i] << 3) | (bits[i + 1] << 2) | (bits[i + 2] << 1) | bits[i + 3]).toString(16);
  }
  return hex;
}

/** Differing bits between two dHashes. ≤ 5 of 64 is effectively the same image. */
export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return 64;
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (x) {
      d += x & 1;
      x >>= 1;
    }
  }
  return d;
}

export const DUPLICATE_THRESHOLD = 5;

export function isPerceptualDuplicate(a: string, b: string): boolean {
  return hammingDistance(a, b) <= DUPLICATE_THRESHOLD;
}
