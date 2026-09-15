/** Debug helper: show why the classifier declined on a sample of products. */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { classifyCatalog } from "../src/lib/catalog-classifier";
import { prisma } from "../src/lib/prisma";

async function main() {
  const { decisions } = await classifyCatalog({ limit: 400 });
  const review = decisions.filter((d) => d.kind === "review").slice(0, 12);
  const ids = review.map((d) => d.productId);
  const rows = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, brand: { select: { name: true } } },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  for (const d of review) {
    const p = byId.get(d.productId);
    console.log(`[${"note" in d ? d.note : ""}]\n   ${p?.brand?.name} — ${p?.name}`);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
