# Your Prestige — Progress Log

Luxury tiles & sanitaryware showroom website + CMS for **Your Prestige**, Mangaluru, Dakshina Kannada, Karnataka.

Last updated: 2026-07-22

## Status: Website + admin shell complete, build passing, not yet deployed

Run locally:
```bash
npm install
npx prisma db push      # creates dev.db from prisma/schema.prisma
node scripts/seed.mjs   # seeds 12 demo leads for the admin dashboard
npm run dev
```
Website → `http://localhost:3000`
Admin → `http://localhost:3000/admin` (no auth yet — see "Not done" below)

---

## Tech stack

Next.js 15 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 ·
Framer Motion · Lenis (smooth scroll) · Lucide Icons · React Hook Form + Zod ·
TanStack Query (installed, not yet used) · Prisma 6 + SQLite (dev) · class-variance-authority

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
- `FaqAccordion.tsx`, `PortfolioGrid.tsx` (animated filter), `ProductCard.tsx`, `ReadingProgress.tsx` (blog scroll bar)
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

Demo content lives in `src/lib/demo-content.ts` (products, brands, gallery, testimonials,
portfolio, FAQs) and `src/lib/blog-content.ts` (3 full SEO articles) — structured 1:1 with
the Prisma models so swapping to live data is a query change, not a refactor.

### APIs (`src/app/api/`)
- `POST /api/leads` — Zod-validated lead capture (contact/quote/visit), naive in-memory rate limit, UTM capture → Prisma
- `POST /api/concierge` — regex intent engine for the AI concierge chat; contract (`{message} → {reply}`) designed to swap in a real Claude-backed endpoint later
- `PATCH /api/admin/leads/[id]` — kanban stage moves, writes to AuditLog (⚠️ no auth check yet)

### Data layer (`prisma/schema.prisma`)
Full CMS model: User (7-role RBAC enum), Category, Brand, Product, Project (portfolio),
GalleryItem, Testimonial, Post (blog), Faq, Offer, Lead (7-stage pipeline + UTM fields),
LeadNote, Conversation, Seo (per product/project/post), Redirect, Setting (k/v store), AuditLog.
SQLite for dev via `DATABASE_URL="file:./dev.db"` in `.env` — schema is portable to
PostgreSQL by changing the `datasource provider`.
`scripts/seed.mjs` seeds 12 realistic demo leads across all pipeline stages.

### Admin panel (`src/app/admin/`, dark theme, `/admin`)
- `layout.tsx` + `components/admin/Sidebar.tsx` — 21-module sidebar (Overview / Content /
  Growth / System sections), topbar with "View Website" link
- `page.tsx` — dashboard: 4 stat tiles (total leads, new, visit bookings, win rate),
  14-day leads bar chart (`components/admin/LeadsChart.tsx`, built per the dataviz skill —
  single-hue gold bars, hover tooltips, sparse axis labels), recent leads list
- `leads/page.tsx` + `components/admin/LeadsKanban.tsx` — full 7-column kanban
  (New→Contacted→Qualified→Visited→Quoted→Won/Lost) with optimistic stage-move buttons
  wired to the PATCH API
- 20 remaining modules (`content/homepage`, `content/products`, `content/categories`,
  `content/brands`, `content/portfolio`, `content/gallery`, `content/videos`,
  `content/testimonials`, `content/blog`, `content/faqs`, `content/offers`, `bookings`,
  `conversations`, `analytics`, `media`, `seo`, `users`, `settings`, `maintenance`, `logs`)
  are scaffolded as `ModuleStub` empty-states, each naming the Prisma model it will bind to

### SEO
LocalBusiness JSON-LD (homepage), Article JSON-LD (blog posts), FAQPage JSON-LD (`/faqs`),
per-page OpenGraph/Twitter metadata, dynamic `sitemap.xml` (static pages + blog posts +
product pages), `robots.txt` disallowing `/admin` and `/api`.

---

## Verified working (2026-07-22)
- `npm run build` — passes, all routes compile (static/SSG where possible)
- `npx tsc --noEmit` — clean
- Smoke-tested against production server: all 12 sampled routes return 200
  (`/`, `/about`, `/products`, product detail, `/portfolio`, blog post, `/contact`,
  `/book-visit`, `/admin`, `/admin/leads`, `/sitemap.xml`, `/robots.txt`)
- `POST /api/leads` — confirmed inserts into SQLite
- `POST /api/concierge` — confirmed intent matching responds correctly

---

## Explicitly NOT done yet (honest gaps)

1. **No authentication on `/admin`** — anyone can currently reach the admin panel and
   the leads PATCH endpoint. NextAuth/Auth.js + RBAC middleware must be added before
   any real deployment. The route handler has a `// NOTE:` marker where the session
   check belongs.
2. **20 of 21 admin modules are stubs** — only Dashboard and Leads have real CRUD/UI.
   Products, Categories, Brands, Portfolio, Gallery, Videos, Testimonials, Blog, FAQs,
   Offers, Bookings, Conversations, Analytics, Media Library, SEO Studio, Users & Roles,
   Settings, Maintenance, Logs are all "module scaffolded" empty states.
3. **Website content is not CMS-driven** — all site content (`demo-content.ts`,
   `blog-content.ts`, `site-config.ts`) is hardcoded TypeScript, not read from the
   database. The Prisma models mirror the shapes exactly so this is a swap, not a rewrite.
4. **Imagery is Unsplash placeholders** — every photo across the site is a curated stock
   image, not real showroom/product photography.
5. **Hero video slot exists but is unused** — `HERO_VIDEO` const in
   `src/components/site/home/Hero.tsx` is `null`; falls back to a Ken Burns still.
6. **Business details are placeholders** — phone, email, address, geo-coordinates,
   social links in `src/lib/site-config.ts` are fictional and need replacing with real data.
7. **AI Concierge is a regex intent engine**, not an actual LLM — designed so the
   `{message} → {reply}` contract can be swapped for a Claude API call without touching
   the UI.
8. **No image upload / media library integration** (UploadThing/Cloudinary) — planned
   but not wired in.
9. **No analytics integration** (GA4/Plausible/etc.) — Analytics module is a stub.
10. **Rate limiting on `/api/leads` is in-memory** — resets on server restart, won't
    work across multiple server instances; noted as needing Upstash/Redis in production.
11. **No tests** — no unit/integration/e2e test suite exists yet.
12. **No CI/CD, no deployment** — not yet pushed to Vercel or any host.

## Suggested next steps, roughly in priority order
1. NextAuth + RBAC middleware guarding `/admin/**` and admin API routes
2. Wire Products/Categories/Brands/Portfolio/Gallery/Testimonials/Blog/FAQs/Offers admin
   CRUD to Prisma, and switch the public site to read from the database instead of
   `demo-content.ts`
3. Replace placeholder imagery with real photography; add the hero film
4. Swap the concierge's regex engine for a Claude-backed endpoint
5. Media library (Cloudinary/UploadThing) + SEO Studio + Settings (business details editable from admin)
6. Analytics integration + admin Analytics dashboard
7. Deploy to Vercel, switch Prisma datasource to PostgreSQL
