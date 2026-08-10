import { Container } from "@/components/ui/Container";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";

export default function ProductDetailLoading() {
  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen">
      {/* Product Hero Skeleton */}
      <div className="relative h-[80vh] flex items-end pb-16 bg-[#111]">
        <Container size="wide" className="w-full space-y-4">
          <Skeleton className="h-4 w-32 bg-white/10" />
          <Skeleton className="h-12 w-1/2 bg-white/10" />
          <Skeleton className="h-6 w-1/3 bg-white/10" />
          <Skeleton className="h-20 w-2/3 bg-white/10" />
          <div className="flex gap-4 pt-4">
            <Skeleton className="h-12 w-48 rounded-xl bg-white/10" />
            <Skeleton className="h-12 w-48 rounded-xl bg-white/10" />
          </div>
        </Container>
      </div>

      {/* Product Specs Skeleton */}
      <section className="bg-white py-20 text-black">
        <Container size="wide" className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-6">
            <Skeleton className="h-4 w-24 bg-stone-200" />
            <Skeleton className="h-10 w-2/3 bg-stone-200" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-28 rounded-2xl bg-stone-100" />
              <Skeleton className="h-28 rounded-2xl bg-stone-100" />
              <Skeleton className="h-28 rounded-2xl bg-stone-100" />
              <Skeleton className="h-28 rounded-2xl bg-stone-100" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-24 bg-stone-200" />
            <Skeleton className="h-10 w-2/3 bg-stone-200" />
            <SkeletonText lines={6} light />
          </div>
        </Container>
      </section>
    </div>
  );
}
