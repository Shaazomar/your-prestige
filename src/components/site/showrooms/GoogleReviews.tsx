import { Star, ExternalLink, PenLine } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { prisma } from "@/lib/prisma";
import type { ShowroomView } from "@/lib/showrooms";

/**
 * Google rating and reviews for a showroom.
 *
 * Reviews are stored as `Testimonial` rows with `source = "google"` rather
 * than in a parallel Review table — they inherit the existing CRUD,
 * moderation and RBAC that way, and the public rendering already existed.
 *
 * Everything here is entered by hand. Google's Business Profile API requires
 * per-user OAuth, verified ownership of each location and an approved quota
 * project; the service-account credential this project has is Calendar-scoped
 * and cannot be reused. This component is the display half of that seam.
 */
export async function GoogleReviews({ showroom }: { showroom: ShowroomView }) {
  const reviews = await prisma.testimonial
    .findMany({
      where: {
        deletedAt: null,
        published: true,
        source: "google",
        OR: [{ showroomId: showroom.id }, { showroomId: null }],
      },
      orderBy: [{ featured: "desc" }, { reviewedAt: "desc" }],
      take: 6,
    })
    .catch(() => []);

  const hasRating = !!showroom.googleRating && showroom.googleReviewCount > 0;
  if (!hasRating && reviews.length === 0) return null;

  return (
    <section className="border-t hairline bg-porcelain py-20 md:py-28">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-eyebrow mb-3 text-gold">Reviews</p>
            {hasRating && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-0.5" aria-hidden>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.round(showroom.googleRating!)
                          ? "fill-gold text-gold"
                          : "text-ink/15"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-lg font-semibold">
                  {showroom.googleRating!.toFixed(1)}
                </p>
                <p className="text-sm text-ink/45">
                  from {showroom.googleReviewCount} Google review
                  {showroom.googleReviewCount === 1 ? "" : "s"}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {showroom.googleReviewUrl && (
              <a
                href={showroom.googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-ink/12 px-5 py-2.5 text-sm transition-colors hover:border-gold/50"
              >
                Read all reviews <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            {showroom.googleWriteReviewUrl && (
              <a
                href={showroom.googleWriteReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm text-ivory transition-opacity hover:opacity-90"
              >
                <PenLine className="h-3.5 w-3.5" /> Write a review
              </a>
            )}
          </div>
        </div>

        {reviews.length > 0 && (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <figure key={r.id} className="rounded-3xl border hairline bg-white p-7">
                <div className="flex items-center gap-0.5" aria-label={`${r.rating} out of 5`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${i < r.rating ? "fill-gold text-gold" : "text-ink/15"}`}
                    />
                  ))}
                </div>
                <blockquote className="mt-4 leading-relaxed text-ink/70">
                  &ldquo;{r.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-5 text-sm">
                  <span className="font-medium">{r.name}</span>
                  {r.reviewedAt && (
                    <span className="ml-2 text-ink/35">
                      {new Date(r.reviewedAt).toLocaleDateString("en-IN", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
