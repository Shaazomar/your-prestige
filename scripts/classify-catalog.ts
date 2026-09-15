/**
 * Runs the catalogue classifier.
 *
 *   npm run classify              # dry run — reports, writes nothing
 *   npm run classify -- --apply   # writes the decisions
 *   npm run classify -- --limit=500
 *   npm run classify -- --apply --include-classified
 *
 * Dry run is the default on purpose: read the report before letting this touch
 * a live catalogue. Even with --apply it only fills a null categoryId and sets
 * the classification status, and it never modifies a product a person has
 * already classified MANUAL.
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { classifyCatalog } from "../src/lib/catalog-classifier";

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const includeClassified = args.includes("--include-classified");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;

  const started = Date.now();
  const { report } = await classifyCatalog({ apply, limit, includeClassified });
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);

  console.log(`\nCatalogue classification ${apply ? "(APPLIED)" : "(dry run — nothing written)"}`);
  console.log("─".repeat(52));
  console.log(`  scanned        ${report.scanned}`);
  console.log(`  classified     ${report.classified}`);
  console.log(`  needs review   ${report.needsReview}`);
  console.log(`  elapsed        ${elapsed}s`);
  console.log("\n  reasons:");
  for (const [reason, count] of Object.entries(report.reasons).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${reason.padEnd(18)} ${count}`);
  }
  if (!apply) console.log("\n  Re-run with --apply to write these decisions.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
