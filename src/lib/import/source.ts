import { readFile } from "fs/promises";
import path from "path";

/**
 * Reads back a stored catalogue PDF so a later slice can reopen it.
 *
 * Uploads land either on Cloudinary (an absolute URL) or on local disk under
 * /public/uploads (a site-relative path), so both have to be handled. Local
 * files are read from disk rather than fetched over HTTP — the app can't
 * reliably address itself from inside a server action.
 */
export async function readImportFile(fileUrl: string): Promise<Uint8Array> {
  if (/^https?:\/\//i.test(fileUrl)) {
    const res = await fetch(fileUrl);
    if (!res.ok) {
      throw new Error(`Could not download the catalogue file (HTTP ${res.status}).`);
    }
    return new Uint8Array(await res.arrayBuffer());
  }

  // Site-relative: /uploads/catalog/... → public/uploads/catalog/...
  const relative = fileUrl.replace(/^\/+/, "");
  const abs = path.join(process.cwd(), "public", relative);

  // Never let a stored path escape the uploads directory.
  const uploadsRoot = path.join(process.cwd(), "public", "uploads");
  if (!abs.startsWith(uploadsRoot)) {
    throw new Error("Refusing to read a catalogue file from outside the uploads directory.");
  }

  try {
    return new Uint8Array(await readFile(abs));
  } catch {
    throw new Error(
      "The uploaded catalogue file is no longer on disk. Local uploads don't survive a redeploy — re-upload the PDF, or configure Cloudinary for durable storage."
    );
  }
}
