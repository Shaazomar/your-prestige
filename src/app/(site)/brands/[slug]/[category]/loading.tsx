import { Container } from "@/components/ui/Container";
import { SkeletonProductGrid } from "@/components/ui/Skeleton";

export default function BrandCategoryLoading() {
  return (
    <div className="bg-white min-h-screen">
      <Container size="wide" className="pt-8 pb-4">
        <div className="h-3 w-40 bg-stone-200/70 rounded-full animate-pulse" />
      </Container>

      <Container size="wide" className="py-8 space-y-8">
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
