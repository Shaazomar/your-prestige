import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { requirePermission } from "@/lib/rbac";
import { runSeoAudit } from "@/lib/seo-audit";
import { cn } from "@/lib/utils";

export const metadata = { title: "SEO Audit" };

/**
 * Live SEO audit — fetches a representative page per template (see
 * `runSeoAudit`) and reports what the rendered HTML actually contains: title,
 * description, canonical, H1 count, structured data, image alt coverage, a
 * broken-link/image spot check, plus a handful of DB-level structural checks.
 *
 * Always renders fresh — it's a diagnostic a person runs on demand, not a
 * page that benefits from caching.
 */
export default async function SeoAuditPage() {
  await requirePermission("seo", "view");
  const report = await runSeoAudit();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">SEO Audit</h1>
        <p className="mt-1 text-sm text-white/40">
          Live check against {report.origin} — generated {new Date(report.generatedAt).toLocaleString("en-IN")}.
          Reload the page to run it again.
        </p>
        <p className="mt-2 max-w-2xl text-xs text-white/30">
          The broken-link and broken-image checks fetch each URL from wherever this server runs. If that
          host&apos;s own outbound network is restricted (a locked-down staging environment, for instance), a
          third-party-hosted image can read as broken when it genuinely isn&apos;t — cross-check anything
          flagged here against a real browser before treating it as confirmed.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Pages audited"
          value={report.summary.pagesAudited}
          tone="neutral"
        />
        <SummaryCard
          label="Pages with issues"
          value={report.summary.pagesWithIssues}
          tone={report.summary.pagesWithIssues === 0 ? "good" : "warn"}
        />
        <SummaryCard
          label="Total issues found"
          value={report.summary.totalIssues}
          tone={report.summary.totalIssues === 0 ? "good" : "warn"}
        />
      </div>

      <section className="rounded-2xl border border-white/8 bg-[#141413] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white/50">
          Sitemap &amp; Robots
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatusRow
            label="sitemap.xml responds and lists sub-sitemaps"
            ok={report.structural.sitemapIndexOk && report.structural.sitemapIndexEntries > 0}
            detail={`${report.structural.sitemapIndexEntries} sitemap${report.structural.sitemapIndexEntries === 1 ? "" : "s"} listed`}
          />
          <StatusRow
            label="robots.txt responds and points to the sitemap"
            ok={report.structural.robotsOk && report.structural.robotsHasSitemap}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-white/8 bg-[#141413] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white/50">
          Database-level findings
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatusRow
            label="Products missing an image"
            ok={report.dbFindings.productsMissingImage === 0}
            detail={`${report.dbFindings.productsMissingImage} of ${report.dbFindings.productsTotal}`}
          />
          <StatusRow
            label="Brands missing a logo"
            ok={report.dbFindings.brandsMissingLogo === 0}
            detail={`${report.dbFindings.brandsMissingLogo} of ${report.dbFindings.brandsTotal}`}
          />
          <StatusRow
            label="Categories missing an image"
            ok={report.dbFindings.categoriesMissingImage === 0}
            detail={`${report.dbFindings.categoriesMissingImage} of ${report.dbFindings.categoriesTotal}`}
          />
          <StatusRow
            label="Local landing pages with no FAQ"
            ok={report.dbFindings.landingPagesMissingFaq === 0}
            detail={`${report.dbFindings.landingPagesMissingFaq} of ${report.dbFindings.landingPagesTotal}`}
          />
          <StatusRow
            label="Orphan categories (zero published products)"
            ok={report.dbFindings.orphanCategories.length === 0}
            detail={report.dbFindings.orphanCategories.map((c) => c.name).join(", ") || undefined}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white/50">
          Page-by-page
        </h2>
        {report.pages.map((p) => (
          <div key={p.url} className="rounded-2xl border border-white/8 bg-[#141413] p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{p.label}</p>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs text-gold hover:underline"
                >
                  {p.url}
                </a>
              </div>
              {p.issues.length === 0 ? (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" /> No issues found
                </span>
              ) : (
                <span className="flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-medium text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5" /> {p.issues.length} issue{p.issues.length === 1 ? "" : "s"}
                </span>
              )}
            </div>

            {p.ok ? (
              <>
                <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
                  <Field label="Title" value={p.title} sub={`${p.titleLength} chars`} />
                  <Field label="Meta description" value={p.description} sub={`${p.descriptionLength} chars`} />
                  <Field label="Canonical" value={p.canonical} sub={p.canonicalMatchesUrl ? "matches URL" : "mismatch"} />
                  <Field label="Robots meta" value={p.robotsMeta ?? "(default: index, follow)"} />
                  <Field label="H1" value={p.h1Text.join(" · ") || null} sub={`${p.h1Count} found`} />
                  <Field
                    label="Image alt coverage"
                    value={`${p.imagesTotal - p.imagesMissingAlt} / ${p.imagesTotal} tagged`}
                  />
                  <Field
                    label="Structured data"
                    value={p.structuredDataTypes.join(", ") || "none found"}
                    sub={p.hasBreadcrumbSchema ? "includes BreadcrumbList" : "no BreadcrumbList"}
                  />
                  <Field
                    label="Broken links / images (sampled)"
                    value={`${p.brokenLinksFound.length}/${p.brokenLinksChecked} links, ${p.brokenImagesFound.length}/${p.brokenImagesChecked} images`}
                  />
                </dl>

                {p.issues.length > 0 && (
                  <ul className="mt-4 space-y-1.5 border-t border-white/8 pt-4">
                    {p.issues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-amber-200/90">
                        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                )}

                {(p.brokenLinksFound.length > 0 || p.brokenImagesFound.length > 0) && (
                  <div className="mt-3 space-y-1 border-t border-white/8 pt-3 font-mono text-[11px] text-red-300/80">
                    {p.brokenLinksFound.map((l) => (
                      <p key={l.href} className="truncate">link {l.status || "unreachable"} — {l.href}</p>
                    ))}
                    {p.brokenImagesFound.map((im) => (
                      <p key={im.src} className="truncate">image {im.status || "unreachable"} — {im.src}</p>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="mt-4 flex items-center gap-2 text-xs text-red-300">
                <XCircle className="h-3.5 w-3.5" />
                {p.issues[0] ?? `Could not fetch this page${p.httpStatus ? ` (HTTP ${p.httpStatus})` : ""}.`}
              </p>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: "good" | "warn" | "neutral" }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-[#141413] p-6">
      <p className="text-xs uppercase tracking-wide text-white/40">{label}</p>
      <p
        className={cn(
          "mt-2 text-3xl font-semibold",
          tone === "good" && "text-emerald-300",
          tone === "warn" && "text-amber-300",
          tone === "neutral" && "text-white"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function StatusRow({ label, ok, detail }: { label: string; ok: boolean; detail?: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-white/8 bg-white/5 p-3">
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
      ) : (
        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
      )}
      <div>
        <p className="text-xs text-white/70">{label}</p>
        {detail && <p className="mt-0.5 text-[11px] text-white/40">{detail}</p>}
      </div>
    </div>
  );
}

function Field({ label, value, sub }: { label: string; value: string | null; sub?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-white/35">{label}</dt>
      <dd className="mt-0.5 truncate text-white/75" title={value ?? undefined}>
        {value ?? <span className="text-red-300">missing</span>}
        {sub && <span className="ml-1.5 text-white/35">({sub})</span>}
      </dd>
    </div>
  );
}
