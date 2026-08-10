import { Container } from "@/components/ui/Container";
import { SkeletonProductGrid } from "@/components/ui/Skeleton";

export default function ProductsLoading() {
  return (
    <div className="bg-white min-h-screen">
      {/* Page Hero Skeleton */}
      <div className="bg-[#111] text-white py-20 border-b border-white/5">
        <Container size="wide" className="space-y-4">
          <div className="h-3 w-24 bg-white/10 rounded-full animate-pulse" />
          <div className="h-10 w-2/3 bg-white/10 rounded-xl animate-pulse" />
          <div className="h-4 w-1/2 bg-white/10 rounded-md animate-pulse" />
        </Container>
      </div>

      {/* Explorer Skeletons */}
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
