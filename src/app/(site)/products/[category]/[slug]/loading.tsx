import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ProductDetailLoading() {
  return (
    <div className="bg-canvas text-text pt-24 pb-20 md:pt-28 md:pb-32 min-h-screen">
      {/* Breadcrumb Skeleton */}
      <section className="mb-8 md:mb-12">
        <Container size="wide">
          <div className="flex items-center justify-between border-b border-line/40 pb-4">
            <Skeleton className="h-4 w-56 rounded-md bg-stone-200/80" />
            <Skeleton className="h-4 w-32 rounded-md bg-stone-200/80" />
          </div>
        </Container>
      </section>

      {/* Hero 2-Column Skeleton */}
      <section className="mb-20 md:mb-28">
        <Container size="wide">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16 items-start">
            {/* Left Gallery Skeleton */}
            <div className="space-y-4">
              <Skeleton className="w-full aspect-[4/3] rounded-[32px_14px_72px_20px] md:rounded-[40px_18px_96px_28px] bg-stone-200/70" />
              <div className="flex gap-3">
                <Skeleton className="h-16 w-20 rounded-xl bg-stone-200/70 shrink-0" />
                <Skeleton className="h-16 w-20 rounded-xl bg-stone-200/70 shrink-0" />
                <Skeleton className="h-16 w-20 rounded-xl bg-stone-200/70 shrink-0" />
              </div>
            </div>

            {/* Right Info Skeleton */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-36 rounded bg-stone-200/80" />
                <Skeleton className="h-6 w-28 rounded-md bg-stone-200/80" />
              </div>

              <div className="space-y-3">
                <Skeleton className="h-12 w-3/4 rounded-lg bg-stone-200/80" />
                <Skeleton className="h-12 w-1/2 rounded-lg bg-stone-200/80" />
                <Skeleton className="h-16 w-full rounded-lg bg-stone-200/60" />
              </div>

              <div className="grid grid-cols-3 gap-3 border-y border-line/40 py-4">
                <Skeleton className="h-10 rounded-lg bg-stone-200/70" />
                <Skeleton className="h-10 rounded-lg bg-stone-200/70" />
                <Skeleton className="h-10 rounded-lg bg-stone-200/70" />
              </div>

              <div className="space-y-3 pt-2">
                <Skeleton className="h-14 w-full rounded-2xl bg-stone-200/80" />
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-12 rounded-xl bg-stone-200/70" />
                  <Skeleton className="h-12 rounded-xl bg-stone-200/70" />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Spec Grid Skeleton */}
      <section className="mb-24 md:mb-32">
        <Container size="wide">
          <Skeleton className="h-64 w-full rounded-[32px] bg-stone-200/60" />
        </Container>
      </section>
    </div>
  );
}
