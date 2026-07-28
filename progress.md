# Your Prestige — Progress Log

Luxury tiles & sanitaryware showroom website + CMS for **Your Prestige**, Mangaluru, Dakshina Kannada, Karnataka.

Last updated: 2026-07-28 (third pass — official branding, Business Settings & Showrooms)

## Status: Website + fully authenticated, database-backed admin CMS. Not yet deployed to production hosting.

Run locally:
```bash
npm install
npx prisma migrate deploy   # applies committed migrations to your DATABASE_URL
node scripts/seed.mjs       # creates the Super Admin login + sample content across every model
npm run dev
```
The seed script prints a generated admin password once — save it, it won't be shown again
(or set `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` env vars before seeding to choose your own).

Website → `http://localhost:3000`
Admin → `http://localhost:3000/admin/login`

---

## Tech stack

Next.js 15 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 ·
Framer Motion · Lenis (smooth scroll) · Lucide Icons · React Hook Form + Zod ·
TanStack Query (installed, not yet used) · **Prisma 6 + PostgreSQL (Neon)** ·
**Auth.js v5 (NextAuth) — Credentials + JWT** · **bcryptjs** · **sonner** (toasts) ·
class-variance-authority

## Root layout / package changes made to the create-next-app scaffold
- `next.config.ts` — added `images.remotePatterns` for Unsplash + Cloudinary, avif/webp formats
- `src/app/globals.css` — replaced default theme with the full luxury design system (see below)
- `src/app/layout.tsx` — swapped Geist fonts for Manrope + Instrument Serif, full SEO metadata block
- `src/app/page.tsx` — deleted; homepage now lives at `src/app/(site)/page.tsx` inside a route group

---

## What's built

### Design system (`src/app/globals.css`)
- Palette: ivory/porcelain background, ink/charcoal/graphite/slate-warm text, stone-100→400 neutrals, gold/gold-light/gold-deep + beige + silver accents
- Type: Manrope (sans) + Instrument Serif italic (`.serif-accent`), clamp-based display scale (`text-display-xl/lg/md/sm`), `.text-eyebrow` for uppercase tracked labels
- Motion tokens: `--ease-luxury`, `--ease-cinematic`; utilities for glass/glass-dark, hairline borders, gold link underline, brand marquee, Ken Burns zoom, scroll-hint pulse, film grain overlay
- Full `prefers-reduced-motion` support

### Motion primitives (`src/components/motion/`)
- `SmoothScroll.tsx` — Lenis wrapper (root scroll)
- `Reveal.tsx` — scroll-triggered reveal + `RevealStagger`/`RevealItem` for staggered lists
- `TextReveal.tsx` — word-by-word mask reveal (hero/heading treatment)
- `Counter.tsx` — spring-animated number counter for stats
- `MagneticButton.tsx` — cursor-follow magnetic wrapper
- `Parallax.tsx` — scroll-linked parallax drift

### Core UI (`src/components/ui/`)
- `Button.tsx` — `Button`/`ButtonLink` with cva variants (primary/gold/outline/outline-light/ghost/ghost-light)
- `Container.tsx`, `SectionHeading.tsx`, `Field.tsx` (TextField/TextArea/SelectField), `BrandIcons.tsx` (inline SVG social icons — lucide-react v1 dropped brand icons)

### Site chrome (`src/components/site/`)
- `Header.tsx` — transparent-over-hero → glass-on-scroll, desktop nav, fullscreen mobile menu
- `Footer.tsx` — CTA band, link columns, contact strip, socials
- `PageHero.tsx` — reusable dark editorial opener for interior pages
- `LeadForm.tsx` — shared RHF+Zod form (used by contact/book-visit/request-quote, differentiated by `type` prop)
- `FaqAccordion.tsx`, `PortfolioGrid.tsx` (animated filter), `ReadingProgress.tsx` (blog scroll bar)
- `catalog/` subfolder — the product catalog system, documented in its own section below
- `JsonLd.tsx` — LocalBusiness structured data
- `FloatingActions.tsx` + `Concierge.tsx` — WhatsApp button + AI concierge slide-in panel

### Homepage (`src/components/site/home/` → `src/app/(site)/page.tsx`)
Hero (Ken Burns still image, video slot ready) → Collections → BrandWall (marquee) →
AboutEditorial (parallax) → Stats (animated counters) → GalleryPreview (masonry) → Testimonials

### Website pages (`src/app/(site)/`)
`/about` `/products` `/products/[category]` `/products/[category]/[slug]` `/brands`
`/portfolio` `/gallery` `/testimonials` `/blog` `/blog/[slug]` `/faqs` `/offers`
`/contact` `/book-visit` `/request-quote`
Plus `src/app/sitemap.ts` and `src/app/robots.ts`.

Demo content lives in `src/lib/demo-content.ts` (brands, gallery, testimonials,
portfolio, FAQs, homepage collections) and `src/lib/blog-content.ts` (3 full SEO
articles) — structured 1:1 with the Prisma models so swapping to live data is a
query change, not a refactor. Product catalog data lives separately in
`src/lib/catalog.ts` (see below).

### Product Catalog — luxury redesign (`src/lib/catalog.ts`, `src/components/site/catalog/`)
The `/products` experience was rebuilt from ordinary ecommerce cards into an
architecture-portfolio-style catalog:
- **`src/lib/catalog.ts`** — rich `CatalogProduct` model: `collection`, `brand`,
  `finish`, `thickness`, `sizes[]`, `applications[]` (11-value room taxonomy),
  `color`, `texture`, `lifestyleImage` (dominant room scene), `textureImage`
  (macro material close-up), `gallery[]` (extra angles/installations), `aspect`
  (portrait/square/landscape — drives masonry rhythm). 9 curated products across
  tiles/sanitary/designer-picks. `getRelated()` scores by category + collection + brand.
- **`ProductCard.tsx`** — magazine-cover card: mouse-tracked 3D tilt (framer-motion
  spring rotateX/rotateY) + a cursor-following radial "lighting" glow, image zoom on
  hover, always-visible tag/brand/collection/name/finish/size chips, a circular
  texture-image swatch overlapping the hero image (the "actual tile image" requirement),
  and a hover-reveal panel with application icons + "View Collection" CTA. Clicking the
  image opens Quick View (does not navigate away); the product name is a direct link
  to the full detail page.
- **`SizeChip.tsx`** — floating pill chips (never raw "600x1200" text), staggered
  reveal-in. **`ApplicationBadge.tsx`** — icon+label chips for all 11 room types
  (Living Room → Hospital), icon map exported as `applicationIcons`. **`BrandMark.tsx`**
  — premium wordmark badge standing in for a real logo asset.
- **`FilterChip.tsx`** — pill filter control with a shared `layoutId` (scoped per
  filter group via a `group` prop) for an animated sliding active-state pill.
- **`CatalogExplorer.tsx`** — the sticky luxury filter bar (search + primary Room
  chips always visible; an expandable "Filters" panel adds Category/Brand/Finish
  chip rows) driving **instant client-side filtering** over a CSS-columns masonry
  grid, with `AnimatePresence`/`layout` enter-exit transitions per card. Used by
  both `/products` (all) and `/products/[category]` (locked category, hides the
  redundant category filter row).
- **`QuickView.tsx`** — fullscreen modal (Esc/arrow-key navigable image slider
  across lifestyle+texture+gallery images, dot indicators, full specs, size/application
  chips, brand mark, Request Quote / Visit Showroom / WhatsApp / wishlist(heart,
  local state only) / share(stub) actions, and a "View Full Details" link to the
  dedicated product page).
- **`RelatedProducts.tsx`** — client wrapper giving the product detail page's
  "Pairs Beautifully With" section its own independent Quick View modal instance.
- **Product detail page** (`/products/[category]/[slug]`) — rebuilt as: 86vh cinematic
  hero (lifestyle image, collection/name/brand/tag, Request Quote + Visit Showroom +
  WhatsApp CTAs) → specs grid (thickness/finish/color/texture icon cards) + size chips
  + application badges + spec-sheet download (stub) → full-bleed parallax texture
  close-up with editorial caption → masonry "Interior Inspiration" gallery (lifestyle
  + gallery images) → dark "Room Visualization" CTA band → related products. Emits
  `Product` JSON-LD.
- Prisma `Product` model extended to match: added `collection`, `thickness`, `sizes`
  (JSON array, replacing the old single `size` string), `color`, `texture`,
  `lifestyleImage`, `textureImage`, `aspect`; `applications`/`images` JSON fields kept.
  Old flat product array in `demo-content.ts` removed in favor of `catalog.ts`.

### APIs (`src/app/api/`)
- `POST /api/leads` — Zod-validated lead capture (contact/quote/visit), naive in-memory rate limit, UTM capture → Prisma
- `POST /api/concierge` — regex intent engine for the AI concierge chat; contract (`{message} → {reply}`) designed to swap in a real Claude-backed endpoint later
- `PATCH /api/admin/leads/[id]` — kanban stage moves, writes to AuditLog (⚠️ no auth check yet)

### Data layer (`prisma/schema.prisma`) — PostgreSQL on Neon
Full CMS model: User (7-role RBAC enum + `UserStatus` invite lifecycle), Category
(self-relation, nested), Brand, Product, Project (portfolio), GalleryAlbum + GalleryItem,
Video, Testimonial, Post (blog, draft/scheduled/published), Faq, Offer, Lead (7-stage
pipeline + UTM), LeadNote, **Booking** (status lifecycle, Google Calendar event id,
reminder tracking), Conversation (soft-delete + `leadId` link), Seo (per path, product,
project, post, category, brand), Redirect, Setting (JSON k/v store), **MediaFolder +
Media**, **AuditLog** (oldValue/newValue/meta as native `Json`, ipAddress, userAgent,
roleAtTime).

Conventions used throughout: `deletedAt` (+ `deletedById` where relevant) for soft
delete/restore; `createdById`/`updatedById` are plain `String?` columns (not enforced
FKs) storing a `User.id` — deliberate, to avoid ~90 unused back-relation arrays on
`User` from every content model needing 2–3 audit FKs; every mutation is additionally
written to `AuditLog` (a real FK) so the trail survives even if the acting user is
later deleted. JSON-array fields (`sizes`, `applications`, `images`, `tags`, etc.) use
Postgres's native `Json` type, not string-encoded JSON.

`DATABASE_URL` (pooled) + `DIRECT_URL` (direct, for `prisma migrate`) both point at
Neon — see `.env`. Migration history lives in `prisma/migrations/` and is committed;
two migrations exist: `init_postgres` and `conversation_soft_delete_and_lead_link`.
`scripts/seed.mjs` creates the Super Admin login and seeds realistic sample data
across every model (categories with nesting, brands, products, a portfolio project,
a gallery album, a video, a testimonial, a blog post, an FAQ, an offer, 10 leads
across every pipeline stage, a booking, and default business/theme/maintenance settings).

### Auth, RBAC & audit foundation
- **`src/lib/auth.config.ts`** — edge-safe base config (session strategy, pages, no
  providers) used by `middleware.ts`, which runs in the Edge runtime and cannot load
  Prisma Client.
- **`src/lib/auth.ts`** — full NextAuth v5 config: Credentials provider (email + bcrypt
  password check against `User.password`), JWT session embedding `id`/`role`/`status`,
  direct `AuditLog` writes for `auth.login` / `auth.login_failed` (captures IP + user
  agent via `next/headers`, since these fire before a session exists and can't use the
  shared `logAudit()` helper, which itself calls `auth()`).
- **`src/middleware.ts`** — protects `/admin/**` and `/api/admin/**`; redirects
  unauthenticated visitors to `/admin/login?callbackUrl=...`; redirects authenticated
  visitors away from the login page; allowlists `/admin/accept-invite` and
  `/admin/reset-password` as public.
- **`src/lib/permissions.ts`** — pure, client-safe RBAC matrix (`Module`/`Action` types,
  `can()`, `permissionsFor()`) — no server-only imports, so `Sidebar.tsx` (a client
  component) can filter nav items by role without pulling `next/headers` into the
  client bundle. **`src/lib/rbac.ts`** re-exports these and adds the server-only
  `requirePermission(module, action)` guard (throws `UNAUTHENTICATED`/`FORBIDDEN`),
  called at the top of every Server Action and the media-upload Route Handler.
  The matrix itself is a **code-defined** `Record<Role, Partial<Record<Module,
  Action[]>>>` — a pragmatic choice over a fully dynamic DB-backed permission system,
  granular enough to gate every module/action pair without an extra
  Permission/RolePermission subsystem. `PermissionMatrix.tsx` renders it read-only
  under Users & Roles.
- **`src/lib/audit.ts`** — `logAudit({action, entity, entityId, oldValue, newValue,
  meta})`, called from every mutating Server Action; captures user/role/IP/user-agent
  via the current session + `next/headers`; never throws (a failed audit write must
  not roll back the primary operation).
- **Invite / reset flows** — `POST /admin/(dashboard)/users` → `inviteUser()` creates
  a `User` with `status: INVITED` + a random `inviteToken` (7-day expiry), emails an
  accept link (via the Resend-backed `sendEmail()`, env-gated); `/admin/accept-invite`
  and `/admin/reset-password` are public pages (outside the auth-required route group)
  that verify the token and bcrypt-hash a new password.
- **Login page split** — all pre-existing admin routes were moved into a
  `src/app/admin/(dashboard)/` **route group** (URLs unchanged — route groups don't
  affect paths) so `/admin/login`, `/admin/accept-invite` and `/admin/reset-password`
  can render without the authenticated dashboard chrome (Sidebar/topbar), while every
  other `/admin/*` URL is identical to before.

### Admin panel (`src/app/admin/`, dark theme) — every module fully backend-powered
- **`(dashboard)/layout.tsx`** — fetches the real session server-side, redirects to
  login if absent (defense in depth behind middleware), renders `Sidebar` with the
  real user + a working Sign Out button (a Server Action), mounts a `<Toaster/>`.
- **Reusable CRUD kit** (`src/hooks/useAdminList.ts`, `src/components/admin/`):
  `useAdminList` (search/sort/paginate/trash-toggle state, calling a Server Action
  on change), `AdminDataTable` (generic table: sortable columns, pagination, active/trash
  toggle, row actions, loading/empty states), `ConfirmDialog`, `Drawer` (slide-in
  create/edit panel), `FormField.tsx` (dark-themed `AField`/`ATextArea`/`ASelect`/
  `AToggle`/`ATagInput`), `ImageUploadField` + `MultiImageField` (upload via
  `/api/admin/media`, or paste a URL). Every module below follows the identical
  `schema.ts` (Zod) + `actions.ts` (Server Actions: list/create/update/soft-delete/
  restore, each wrapped in `requirePermission` + `logAudit`) + `XForm.tsx` +
  `XManager.tsx` + `page.tsx` pattern — Categories was built first as the reference
  implementation and independently verified against Neon before being replicated.
- **Dashboard** (`page.tsx`) — live counts across every model (leads, pending bookings,
  win rate, products, brands, categories, gallery images, videos, blog posts,
  testimonials, offers), the existing 14-day leads chart, recent leads, **recent
  activity** pulled from `AuditLog`, and an honest "Connect GA4" card instead of fake
  traffic numbers.
- **Content modules** — Categories (nested, nested-parent picker), Brands (logo/banner/
  catalog PDF), Products (specs, sizes/applications tag inputs, lifestyle+texture
  images, multi-image gallery, manually-curated related products, bulk-select +
  bulk-delete), Portfolio (builder/architect/completion date), Gallery (albums +
  drag-reorderable items with inline alt-text editing), Videos (YouTube/Vimeo/Upload),
  Testimonials (rating, Google/video source), Blog (Markdown content, tags, **draft /
  scheduled / published** — a `promoteDuePosts()` check on every list load flips
  due-scheduled posts live, since there's no background job runner), FAQs, Offers
  (validity window + countdown flag).
- **Leads** — unchanged kanban, now with the PATCH API wired to `requirePermission` +
  `logAudit` (previously had a `// NOTE: wire auth` marker with none).
- **Bookings** — List **and Calendar** views (month grid, click a day's booking to
  edit), Confirm/Reject one-click row actions, full edit drawer (reschedule by editing
  the date + status), consultant assignment, **Send Reminder** (env-gated email via
  Resend), and **`src/lib/google-calendar.ts`** — a real service-account-based Calendar
  API integration (JWT-signed via Node's `crypto`, no OAuth consent flow needed for a
  single business calendar) that creates/updates/deletes events on
  create/update/reschedule/delete — inactive until `GOOGLE_SERVICE_ACCOUNT_JSON` +
  `GOOGLE_CALENDAR_ID` are set.
- **AI Conversations** — the concierge API (`/api/concierge`) now actually **persists
  every chat** to `Conversation` (keyed by a `crypto.randomUUID()` session id stored in
  `sessionStorage`), previously it stored nothing. Admin viewer: transcript modal,
  search (via `$queryRaw` + `ILIKE` against the JSONB messages column, since Prisma's
  typed Json filters can't search arbitrary array-of-objects content), Resolve toggle,
  **Extract Lead** (creates a `Lead` from the transcript, pulling a phone number if the
  visitor shared one), CSV export.
- **Media Library** — folder sidebar (flat, create-only), grid view with upload
  (drag-free click-to-upload, multi-file), inline alt-text editing, trash/restore.
  **`src/lib/storage.ts`** — uploads to Cloudinary when configured, else falls back to
  local disk under `public/uploads` (dev-only; most hosts including Vercel have an
  ephemeral filesystem in production, so this throws a clear error if `VERCEL` is set
  without Cloudinary creds, rather than silently failing).
- **SEO Studio** — two tabs: per-path meta overrides (title/description/keywords/
  canonical/OG image/raw JSON-LD override/noindex) against the generic `Seo.path`
  field, and **Redirects** (from/to/status code/active) — both hard-delete (no
  undo needed for config records), so `AdminDataTable` gained a `hideTrashToggle` prop.
- **Users & Roles** — invite (sends email), edit name/role, deactivate/reactivate
  (a user can't deactivate themselves), resend invite, send password-reset email, plus
  the read-only `PermissionMatrix` reference table.
- **Settings** — Business Details and Theme (accent color) are editable and persist to
  `Setting`; an **Integrations** panel shows live Configured/Not-Configured status for
  Cloudinary/Resend/Google Calendar/GA4 by checking `process.env` — deliberately
  **read-only**: secret credentials are never stored in the database or editable via
  a web UI (a security decision, not a missing feature), only in environment variables.
- **Maintenance** — enable toggle, message, countdown datetime, IP whitelist, preview
  password — and **real enforcement**, not just a settings screen: `src/lib/
  maintenance.ts` + `src/app/(site)/layout.tsx` check `Setting` on every public-site
  request (Server Component, Node runtime — middleware can't do this since it's
  Edge-only and can't load Prisma) and render a branded holding page unless the visitor
  has a valid HMAC-signed bypass cookie (issued by entering the preview password) or a
  whitelisted IP. Verified live: enabled it, confirmed the public homepage showed the
  holding page while `/admin/login` stayed completely unaffected, then disabled it.
- **Audit Logs** — search/filter (by entity, free text across action/entity/user/IP),
  a detail modal showing old/new JSON diffs, CSV export. Every mutation across every
  module above writes here, plus auth login/login_failed/logout.
- **Homepage Editor** — hero heading/subheading/eyebrow/image/video/button
  label+links stored as a `homepage.hero.draft` `Setting`, with real **Draft → Publish
  → Preview** semantics: editing saves to the draft key only; "Publish" copies draft →
  `homepage.hero.published`, which is what `getPublishedHomepageHero()` (called from
  the public homepage) actually reads; "Preview" opens `/?preview=1`, which — only for
  a visitor with a valid admin session — renders the *draft* instead. The public
  `Hero.tsx` component was converted from hardcoded copy to props-driven, reading
  real DB content for the first time on the site.
- **Analytics** — real, live: lead conversion funnel (by status, computed from actual
  `Lead` rows), leads-by-source, leads-by-type. Traffic/top-pages/countries/devices/
  realtime are clearly marked as requiring GA4 rather than showing fabricated numbers.

### SEO
LocalBusiness JSON-LD (homepage), Article JSON-LD (blog posts), FAQPage JSON-LD (`/faqs`),
per-page OpenGraph/Twitter metadata, dynamic `sitemap.xml` (static pages + blog posts +
product pages), `robots.txt` disallowing `/admin` and `/api`.

---

## Branding, Business Settings & Showrooms (third pass)

### Official brand identity
The supplied logo asset (`logo.png`) is the **"P" monogram only** — brand yellow
`#FFD900` — with no wordmark or tagline in the file. So the mark is used as-is and
the `your / PRESTIGE / TILES & SANITARY` lockup plus tagline are typeset around it in
**`src/components/brand/Logo.tsx`** (props: `size`, `tone`, `stacked`, `markOnly`,
`withTagline`). That keeps the lockup crisp at any size and lets it adapt to light
and dark surfaces. `TILES & SANITARY` renders in brand yellow on dark and a darkened
`#a88a00` on ivory, because pure `#FFD900` is unreadable on a light background.

Generated from the source PNG into `public/brand/` (transparent-background mark,
192/512 PWA icons, 180px apple-touch-icon, 32px favicon, 1200×630 OG image):
- Browser tab / PWA: `src/app/icon.png`, `src/app/apple-icon.png`, `src/app/manifest.ts`
- Social: `src/app/opengraph-image.png`, `src/app/twitter-image.png`
- In-app: Header, Footer, Admin sidebar, Login, Accept-invite, Reset-password,
  Maintenance holding page, and a new branded **404** (`src/app/not-found.tsx`)
- The Next.js scaffold SVGs and default favicon were deleted.

**Colour decision:** the existing muted-gold (`#b3915a`) UI accent is *unchanged* —
swapping the whole site to brand yellow would have been the redesign the brief ruled
out. Brand yellow is registered as `--color-brand` and reserved for the logo lockup.

### Business Settings — nothing hardcoded
`src/lib/business.ts` exposes `getBusiness()`, a React-`cache()`d reader over the
`Setting` table with `site-config.ts` as fallback. Header, Footer, FloatingActions,
Concierge, Contact and all JSON-LD now read from it. Seeded values (via
`scripts/seed.mjs`, which **upserts** so re-running corrects drift):

| Field | Value |
|---|---|
| Name | Prestige Tiles & Sanitary |
| Tagline | Designing Spaces, Crafting Elegance |
| Phone / WhatsApp | +91 90089 19195 |
| Email / Website | *(intentionally blank — not supplied)* |
| Hours | Mon–Sat 9:00 AM – 7:00 PM |
| Sunday | Jeppinamogaru 9 AM–1 PM · Puttur 9 AM–12 PM · other branches closed |
| Instagram | instagram.com/prestige_sanitarytiles |
| Facebook | facebook.com/prestige.sanitarytiles |
| Threads | threads.com/@prestigeshop.in |

Socials render site-wide (a `ThreadsIcon` was added; YouTube/LinkedIn removed as they
weren't supplied). The Footer degrades gracefully where email is blank, showing a
"find your nearest showroom" link instead of an empty mailto.

### Showrooms — new model, CMS module and public pages
New **`Showroom`** Prisma model + migration `20260728120624_showrooms_and_booking_details`
(applied to Neon): address, geo, map URL/embed, directions, phone/WhatsApp/email,
manager, per-branch weekday + Sunday hours, hero image, gallery, video, description,
brands stocked, amenities, featured product ids, flagship/published/sort. `Booking`
gained `showroomId`, `preferredTime` and `interestedIn`.

**All five real showrooms seeded** with the supplied addresses, phones and hours:
Jeppinamogaru (flagship, Jaquar Authorized Dealer) · Pandeshwar · Derlakatte ·
Puttur (Pro Prestige) · Moodbidri (Accu Prestige).

**Real photography:** 39 genuine showroom interior photos from the supplied images
folder were optimised to WebP (~4 MB total) into `public/showrooms/` and distributed
across the five galleries. Four portrait photos of a person in that folder were
deliberately **excluded** — they're people photos, not showroom interiors, and
publishing someone's likeness needs their role/consent established first.

- **Admin:** `/admin/content/showrooms` — full CRUD following the established
  schema/actions/form/manager pattern, with `requirePermission` + `logAudit` on every
  mutation and `revalidatePath` so public pages update immediately. `showrooms` was
  registered in the RBAC matrix; the dashboard now counts showrooms.
- **Public:** `/showrooms` (filterable, opt-in nearest-showroom ranking) and
  `/showrooms/[slug]` (hero video/image, essentials, map, brands, gallery, featured
  products, booking CTA, other branches). Both ISR-cached at 5 minutes.
- **Homepage:** new `ShowroomsSection` reusing the same explorer.
- **Contact page** rebuilt around all five branches instead of one address.
- **Nearest-showroom detection** is opt-in only — geolocation is never requested
  automatically, and coordinates never leave the browser (ranking is client-side).

### Booking, SEO & Concierge
- **Book a Visit** now takes a preferred showroom and time slot, deep-links from every
  showroom card (`/book-visit?showroom=slug`), and a dated VISIT enquiry now creates a
  real **`Booking`** row linked to both the lead and the showroom — so it lands in the
  admin Bookings calendar, not just the leads pipeline. Confirmation email and Google
  Calendar sync fire through the existing env-gated helpers.
- **SEO:** `OrganizationJsonLd` emits an Organization schema plus **one LocalBusiness
  (HomeGoodsStore) schema per showroom**, each with its own address, geo, map link and
  parsed opening hours (Sunday omitted when that branch is closed). Showroom URLs added
  to the sitemap at priority 0.9.
- **AI Concierge** is now grounded in live CMS content via
  `src/lib/concierge-knowledge.ts` (products, brands, showrooms, FAQs, blog, business
  settings; 60s in-process cache). It answers branch questions, per-branch Sunday hours,
  "do you stock <brand>", and specific product specs from the database — so it cannot
  invent a showroom or product that doesn't exist. It remains a deterministic
  retrieval engine, not an LLM; swapping in Claude means replacing `buildReply()` and
  passing the same knowledge object as grounding context.

---

## Verified working (2026-07-28, admin CMS build)
- Postgres migration applied to the real Neon database (`prisma migrate deploy`),
  confirmed all 22 tables exist and are queryable.
- `npm run build` — passes with zero errors (only a harmless Next.js workspace-root
  warning about a second lockfile); `npx tsc --noEmit` — clean.
- **Auth flow tested end-to-end against the running production server**, not just
  page-load smoke tests: fetched a real CSRF token, POSTed wrong credentials (rejected
  cleanly, redirected with `?error=CredentialsSignin`), POSTed correct credentials
  (redirected to `/admin`, session confirmed via `/api/auth/session` showing the real
  user/role), confirmed `/admin` now loads 200 authenticated, confirmed visiting
  `/admin/login` while authenticated redirects away, confirmed unauthenticated
  `/admin` redirects to login and unauthenticated `POST /api/admin/media` returns 401.
- **All 21 admin modules** (`/admin` dashboard, all 11 content modules, leads, bookings,
  conversations, analytics, media, seo, users, settings, maintenance, logs) smoke-tested
  authenticated in one pass against the built production server: every one returns 200
  with zero server errors in the logs.
- **Categories** was built first as a reference implementation and independently
  verified: its exact Prisma query (search + soft-delete filter + pagination) run
  directly against Neon returned correct results before being replicated to the other
  10 content modules.
- **Concierge → Conversation persistence** verified live: POSTed a real chat message,
  confirmed via a direct DB query that the Conversation row was created with both the
  user and assistant messages in its JSONB `messages` array.
- **Maintenance mode enforcement** verified live end-to-end: enabled it via a direct DB
  write, confirmed the public homepage served the branded holding page (200, holding-page
  copy present) while `/admin/login` remained fully reachable and unaffected, then
  disabled it again and confirmed the flag was back to `false`.
- **AI Conversations search** (raw SQL `ILIKE` against the JSONB messages column, since
  Prisma's typed Json filters can't search arbitrary array-of-objects content) verified
  directly against Neon with a real seeded conversation.
- Every Server Action across every module calls `requirePermission()` (throws
  `UNAUTHENTICATED`/`FORBIDDEN`) and `logAudit()` on mutation — not spot-checked, this
  is the enforced pattern every module was built against.

---

## Explicitly NOT done yet (honest gaps)

1. **The public-facing website still reads from static demo files, not Postgres** —
   this is the single biggest remaining gap. `/products`, `/brands`, `/portfolio`,
   `/gallery`, `/blog`, `/testimonials`, `/faqs`, `/offers` all still render from
   `src/lib/catalog.ts` / `demo-content.ts` / `blog-content.ts`, **not** from what an
   admin creates in the CMS you just built full CRUD for. Only the **Homepage Hero**
   (draft/publish/preview) and **Maintenance mode** are wired end-to-end from DB to the
   live site. This wasn't in scope for this pass (the request was explicitly the admin
   backend, not the public site), but it means: creating a product in
   `/admin/content/products` right now does **not** make it appear on `/products`. Given
   how the schemas already mirror each other 1:1, wiring each public page to its Prisma
   model is a query-swap per page, same pattern as the Homepage Hero wiring — the
   natural, highest-value next step.
2. **Cloudinary, Google Calendar, Resend email and GA4 are all coded and wired but
   inactive** — no real credentials were provided beyond the Neon database connection
   string. Each integration has a real implementation (signed JWT service-account auth
   for Calendar, actual Resend API calls, actual Cloudinary signed upload) gated behind
   `process.env` checks, with local-disk/no-op fallbacks so nothing breaks — but none of
   them will do anything live until you add the credentials from the setup guide earlier
   in this conversation. The Settings → Integrations panel shows live
   Configured/Not-Configured status for each.
3. **Imagery is still Unsplash placeholders** — unchanged from before; no product
   photography was supplied as an actual file this environment could read.
4. **Local media uploads don't survive a Vercel deploy** — `src/lib/storage.ts` falls
   back to writing into `public/uploads/` only when Cloudinary isn't configured; this
   works for local dev but Vercel's filesystem is ephemeral/read-only in production, so
   Cloudinary credentials are a hard requirement before deploying, not optional polish.
5. **No session invalidation on deactivation** — JWT sessions are stateless; a
   `deactivateUser()` call updates the DB immediately, but a user's *existing* browser
   session (JWT) stays valid until it expires or they re-authenticate, since there's no
   server-side session store to revoke. Every Server Action still re-checks
   `requirePermission()` against the live DB role/status on each call as defense in
   depth, but the raw ability to load already-rendered admin pages persists briefly.
   Fixing this properly needs either short-lived JWTs + refresh rotation or a DB-backed
   session strategy — noted, not built, given time constraints.
6. **Scheduled blog posts publish on next admin page load, not on a timer** —
   `promoteDuePosts()` runs opportunistically inside `listPosts()`; there's no cron/queue
   in this deployment, so a scheduled post won't flip to published until someone next
   opens the Blog module in admin (or you wire a real cron hitting a small endpoint that
   calls the same check).
7. **Media Library folders are flat, not nested** — the `MediaFolder` schema supports a
   parent/child tree (self-relation), but the UI only shows a flat list; nested folder
   navigation wasn't built.
8. **No automated tests** — still none; all verification in this pass was live
   build/typecheck/smoke-testing against the real Neon database and running server, not
   an automated test suite.
9. **No CI/CD, no production deployment** — the app runs locally against the real Neon
   Postgres instance; it has not been deployed to Vercel or any host.
10. **Rate limiting on the public `/api/leads` endpoint is still in-memory** — resets on
    server restart, won't work across multiple server instances in production.

## Third-pass gaps (branding / showrooms brief)

1. **Google Maps URLs are search links, not canonical place links.** The brief listed
   "(User supplied URL)" as a literal placeholder for all five showrooms, so each
   `mapUrl` is a Maps *search* URL built from the address. They resolve correctly, but
   should be replaced with real "Share → Copy link" place URLs via Admin → Showrooms.
2. **Showroom coordinates are approximate locality centroids**, used only to rank
   nearest-showroom. They should be corrected to exact pins in the admin — the
   latitude/longitude fields are editable.
3. **Email and website are blank by design** (not supplied). The Footer and schema
   omit them cleanly rather than showing placeholders.
4. **Per-showroom hero videos are empty.** The `video` field is wired end-to-end
   (detail page plays it over the hero when set) but no footage was supplied — the
   `vedio/` folder in the images directory contained no video files.
5. **The "28 New Premium Sections" list is not built.** Tile Finder, Tile Calculator,
   Material Comparison, Virtual Showroom, Before & After, the three partner programmes
   (Architect/Builder/Interior Designer), the four studio pages (Kitchen/Bathroom/
   Outdoor/Sanitary Experience Center), Awards, Meet Our Experts, Design Inspiration
   and the rest are **not implemented** — that list alone is a multi-month scope. This
   pass prioritised the concrete, real-data work: branding, business settings,
   showrooms, booking, SEO and concierge grounding.
6. **Product experience extras not built:** Recently Viewed and Wishlist persistence
   (the QuickView heart is still local state only), and Catalog PDF per product.
7. **Public catalogue still reads from `src/lib/catalog.ts`,** not the Product table —
   unchanged from the previous pass and still the single biggest remaining gap. The
   Showrooms module is the reference for how to wire a public page to Postgres.
8. **Four portrait photos** of a person sit unused in the supplied images folder. They
   were excluded from showroom galleries deliberately; they'd suit a "Meet Our Experts"
   section once the person's name, role and consent are confirmed.

## Suggested next steps, roughly in priority order
1. Wire the public website pages (Products/Brands/Portfolio/Gallery/Blog/Testimonials/
   FAQs/Offers) to read from Postgres instead of the static demo files — same pattern
   already proven for the Homepage Hero.
2. Add the real credentials from the setup guide (Cloudinary first — it unblocks
   production media uploads; then Resend, Google Calendar, GA4) and flip each on.
3. Deploy to Vercel; confirm `DATABASE_URL`/`DIRECT_URL`/`AUTH_SECRET` and all
   integration env vars are set there; run `prisma migrate deploy` against production.
4. Replace placeholder imagery with real showroom/product photography.
5. Swap the concierge's regex intent engine for a real Claude-backed endpoint — the
   `{message, sessionId} → {reply}` contract and Conversation persistence are already
   in place, so this is an isolated change inside `/api/concierge/route.ts`.
6. Nested Media Library folder navigation; a real cron for scheduled blog publishing.
7. Session invalidation strategy for immediate effect on user deactivation.
