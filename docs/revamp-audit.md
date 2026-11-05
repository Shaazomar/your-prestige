# Prestige Tiles — revamp audit (Phase 1)

Audit of the existing codebase against the revamp brief, run against a
production-faithful local replica. Everything below was observed, not
inferred from reading code alone; where something could not be verified, that
is stated rather than assumed.

## How this was verified

The live catalogue lives in a Neon Postgres shared with prestige-inv (the
ERP). This container has no credentials for it, and per the brief it must
never be written to from here. So a local replica was built instead:

- PostgreSQL 16 on `127.0.0.1:5433`, schema applied from `prisma/schema.prisma`
  plus the two hand-written SQL files in `prisma/sql/`.
- `scripts/load-catalog-fixture.mjs` (new) rebuilds the catalogue from
  `scratch/product_image_audit_report.csv`, a 6,215-row snapshot of the live
  catalogue taken during the earlier image-recovery pass. Real product names,
  brands, SKUs, categories and the S3 image URL each product resolved to.
- Result: 6,217 products, 6,142 public, 75 held back — across Jaquar (4,835),
  Artize (490), Essco (425), Motto (334), Velzone (89), Lonix (30).
- QA driven with Playwright at 1920×1080, 1440×900, 768×1024 and 390×844.

Two caveats on the environment: the sandbox proxy blocks `images.unsplash.com`
and `maps.google.com`, so demo/gallery imagery and the contact map cannot load
here (counted separately in QA output, not as site defects). And the replica
reflects the catalogue *as the snapshot found it*, which is not necessarily
what production holds today.

## The headline finding: the image pipeline is not broken in this code

The brief states that most Artize, Essco, Velzone and Lonix products show
placeholders. That does not reproduce here, and the evidence points away from
the application code:

- **The earlier audit's verdict was a false negative.** `scratch/audit_results_full.json`
  reports 5,164 of 6,215 products "broken", including all 4,835 Jaquar rows,
  each with `checkReason: "s3_error_Error"`. Those S3 objects exist and are
  publicly readable. Fetched directly over HTTPS, the Jaquar, Motto and Artize
  URLs named in that report all return `200` with real payloads (72 KB, 197 KB,
  67 KB). The audit script's S3 calls were failing — credentials or network —
  not the objects.
- **No damage resulted.** `scratch/fast-hide-missing.mjs` and
  `hide-missing-image-products.mjs` only unpublish products with *no image
  reference at all*; they never consumed the "broken" verdict. The 75 held-back
  products are genuinely image-less.
- **Rendering is correct end to end.** `/products` emits real S3 URLs and zero
  "coming soon" placeholders. In a real browser, `/brands/jaquar` and
  `/brands/artize` load 34/34 images each; `/bathware` 26/26. The one failure
  across the whole sweep was a single transient S3 timeout that returns `200`
  on retry.

`resolveImageRef` → `toCatalogProduct` → `SafeImage` resolves S3 keys,
absolute URLs and site-relative paths correctly, falls back through
`lifestyleImage → images[0] → image_key → thumbnail_key → textureImage`, and
`next.config.ts` derives `remotePatterns` from env with `image-hosts.ts` as a
client-side second layer.

**So the production symptom is a data or environment problem, not a code
problem.** The three candidates, in order of likelihood:

1. **Production DB state differs from this snapshot** — the recovery pass
   wrote its results somewhere this snapshot doesn't reflect, or was partially
   rolled back.
2. **The image optimizer.** `next.config.ts` sets `unoptimized` unless
   `IMAGE_OPTIMIZER=on`, with a comment recording that production `/_next/image`
   was returning HTTP 402 (`OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED`) and
   blanking every uncached image. If that flag is `on` in production with the
   quota still exhausted, every image blanks while the S3 objects are fine —
   which matches the reported symptom precisely, including why *some* products
   (already-cached ones) still show.
3. **`NEXT_PUBLIC_S3_BUCKET_URL` unset or wrong in production**, so URLs are
   built against the wrong base.

Diagnosing further needs production: a read-only `DATABASE_URL`, or a dump of
`id, slug, brandId, lifestyleImage, image_key, images, published, status` for
a few hundred affected rows, plus confirmation of `IMAGE_OPTIMIZER` and
`NEXT_PUBLIC_S3_BUCKET_URL`. Without one of those this cannot be closed out
honestly.

## Critical: the admin passkey was published in the repository

`src/lib/auth.ts` compared the admin passkey against a literal:
`passkey !== "your@prestige"`. Committed, therefore public to anyone with repo
access — and guessable, being a phrase from the site's own masthead. It gated
the full catalogue, customer orders, enquiry records with names and phone
numbers, and the CMS.

Fixed: the value now comes from `ADMIN_PASSKEY` with no fallback, compared in
constant time. **This fails closed — set `ADMIN_PASSKEY` before the next
deploy or the admin panel is unreachable.** Treat the old value as
compromised. See `docs/admin-auth.md`.

That document also records the part not fixed, which needs an owner decision:
the passkey is a single shared credential, and the session attaches to
whichever account the lookup resolves first. So `AuditLog` cannot attribute an
action to a person, deactivating a user does not revoke their access,
`User.password` (already bcrypt-hashed) is never verified, and the role and
permission system effectively grades every session as that one account. There
is also no rate limiting on the login form.

## What the brief asks for that already exists

The brief reads as a from-scratch rebuild. Much of it is already built, and
rebuilding would destroy working code:

| Brief section | Status |
| --- | --- |
| Shop, filters, sorting, search, facet counts | Built — `CatalogBrowser` does DB-side faceted search; counts verified against the database |
| Product detail, gallery, specs, related, recently-viewed | Built — real images, breadcrumbs, product code, quantity + unit selector |
| WhatsApp ordering with formatted message | Built — `whatsapp-message.ts`, variant-aware |
| Brand / category / collection pages | Built — `/brands/[slug]`, category tree, collections |
| Admin panel | Built, and large — 39 modules including Products, Brands, Categories, Collections, Orders, Leads, Inventory, Media, SEO, Homepage CMS, Image Review, Classification, Catalog Imports, Excel Import, WhatsApp Commerce. All 13 spot-checked modules return 200 |
| Catalogue importer (PDF/OCR) | Built — `src/lib/extract`, `src/lib/import`, admin review queue, nothing auto-publishes |
| SEO — sitemaps, canonicals, OG, structured data | Built — sitemap splits, per-product OG via `next/og`, Product + BreadcrumbList schema |
| ERP/inventory separation | Correct — catalogue code never writes Inventory, InventoryMovement or StockBlock |

All 30 public routes return 200. Typecheck and lint are clean.

## Defects found and fixed

1. **No product was visible on the first screen of any listing page.**
   `CatalogueHero` sits above every listing and filled the viewport entirely.
   Measured first-product offsets: 955px at 1440×900 and 981px at 390×844,
   against viewports of 900 and 844 — the shop opened on no products and not
   even the filter bar. Now 739px and 623px; products and toolbar are visible
   immediately at both sizes.
2. **The homepage captioned three Unsplash portraits of real, unrelated people
   as the architects who trust this showroom.** Fabricated social proof from
   strangers' photographs, and bare `next/image` rather than `SafeImage`, so
   an unreachable host rendered three broken-image glyphs under the headline.
   Replaced with a non-photographic monogram cluster.
3. **`scripts/seed.mjs` could not complete.** `seedOffers` wrote
   `title`/`validFrom`/`validUntil`/`showCountdown`/`published` — columns
   `Offer` no longer has. Seeding aborted there, so on a fresh database leads,
   bookings, business settings and all five showrooms were silently never
   seeded.
4. **The admin passkey**, above.

## Defects found, not yet fixed

- **Brand pages bury their products.** `/brands/jaquar` puts the first product
  at 1533px (laptop) and 1680px (mobile). Unlike the shop fix this is not
  padding — the brand hero and category cards legitimately come first — so it
  needs a layout decision rather than a tweak.
- **The admin product list renders broken-image glyphs** for image-less
  products; it does not route thumbnails through `SafeImage`.
- **Gallery content is stock photography.** 36 of 38 gallery images are
  Unsplash URLs, against a brief that asks for genuine showroom and
  installation photographs. This needs real assets, not code.
- **`scripts/seed.mjs` seeds the wrong brands** — Somany, Kajaria, Grohe,
  Kohler, Duravit rather than the six brands the business actually carries.
  They then pollute brand filters on a seeded environment.
- **Duplicate SKUs in the catalogue.** 133 rows in the snapshot repeat a SKU
  already used by another product, consistent with the scrape reports (314
  duplicate Motto rows, 44 Jaquar). `Product.sku` is `@unique`, so these
  cannot all be represented; worth a dedupe pass against production.
- **Thin product specifications.** Finish, thickness, colour and size are
  frequently absent, so the PDP shows "Standard", "—", "Natural" from
  `toCatalogProduct`'s fallbacks. The data is missing, not the rendering.

## What has not been verified

- Anything about production itself — see the image section above.
- The checkout/enquiry submission path end to end, and admin receipt of that
  enquiry. The forms render; the full round trip was not driven.
- The PDF/OCR importer against a real brand catalogue. `progress.md` records
  it has only ever run against a generated fixture.
- Tile coverage/box calculations — the quantity selector and unit dropdown
  exist; the coverage calculator described in the brief was not located.
- Performance and Core Web Vitals, which are not meaningful against a dev
  server.

## Running this locally

```bash
npm install
```

```bash
DATABASE_URL=postgresql://... DIRECT_URL=postgresql://... npx prisma db push
```

```bash
node scripts/seed.mjs && node scripts/load-catalog-fixture.mjs
```

The fixture loader refuses to run against a non-local `DATABASE_URL` and
touches no ERP table. `.env.local` needs `DATABASE_URL`, `DIRECT_URL`,
`AUTH_SECRET`, `ADMIN_PASSKEY` and `NEXT_PUBLIC_S3_BUCKET_URL`.
