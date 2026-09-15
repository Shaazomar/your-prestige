import { Container } from "@/components/ui/Container";
import { SkeletonProductGrid } from "@/components/ui/Skeleton";

/**
 * Streaming skeleton for the index page only.
 *
 * It lives in an `(index)` route group — which does not change the URL —
 * because a `loading.tsx` creates a Suspense boundary over its segment *and
 * every segment below it*. With this file one level up, the shell of
 * `/tiles/...` detail pages flushed with HTTP 200 before their `notFound()`
 * or `redirect()` ever threw, so unknown URLs answered 200 with a 404 body
 * and redirects were delivered as a client-side hop. Keep it inside the
 * group.
 */

export default function TilesLoading() {
  return (
    <div className="bg-white min-h-screen">
      <div className="bg-secondary py-20 border-b border-line">
        <Container size="wide" className="space-y-4">
          <div className="h-3 w-24 bg-stone-200/70 rounded-full animate-pulse" />
          <div className="h-10 w-2/3 bg-stone-200/70 rounded-xl animate-pulse" />
          <div className="h-4 w-1/2 bg-stone-200/70 rounded-md animate-pulse" />
        </Container>
      </div>

      <Container size="wide" className="py-12 space-y-8">
        <div className="flex gap-3 items-center">
          <div className="h-8 w-48 bg-stone-100 rounded-full animate-pulse" />
          <div className="h-8 w-24 bg-stone-100 rounded-full animate-pulse" />
          <div className="h-8 w-32 bg-stone-100 rounded-full animate-pulse" />
        </div>
        <SkeletonProductGrid count={10} light />
      </Container>
    </div>
  );
}
