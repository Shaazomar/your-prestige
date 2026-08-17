import { Container } from "@/components/ui/Container";
import { SkeletonProductGrid } from "@/components/ui/Skeleton";

export default function CategoryLoading() {
  return (
    <div className="bg-white min-h-screen">
      {/* Page Hero Skeleton */}
      <div className="bg-secondary py-20 border-b border-line">
        <Container size="wide" className="space-y-4">
          <div className="h-3 w-24 bg-stone-200/70 rounded-full animate-pulse" />
          <div className="h-10 w-2/3 bg-stone-200/70 rounded-xl animate-pulse" />
          <div className="h-4 w-1/2 bg-stone-200/70 rounded-md animate-pulse" />
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
