import { syncCatalogProductsToDb } from "../src/lib/sync-products";

async function main() {
  console.log("Starting Product Database Synchronization...");
  const report = await syncCatalogProductsToDb();
  console.log("=== PRODUCT SYNC REPORT ===");
  console.log("Existing DB Products:", report.existingProductsCount);
  console.log("Matched Products:", report.matchedProductsCount);
  console.log("Updated Products:", report.updatedProductsCount);
  console.log("New Products Created:", report.newProductsCount);
  console.log("Failed Records:", report.failedRecordsCount);
  console.log("Details:", report.details);
}

main().catch((err) => {
  console.error("Sync error:", err);
  process.exit(1);
});
