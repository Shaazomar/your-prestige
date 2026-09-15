import { Container } from "@/components/ui/Container";
import { SkeletonProductGrid } from "@/components/ui/Skeleton";

export default function BrandLoading() {
  return (
    <div className="bg-white min-h-screen">
      <div className="bg-ink py-40 pb-20 md:pb-28 md:pt-52">
        <Container size="wide" className="space-y-6">
          <div className="h-3 w-32 bg-white/15 rounded-full animate-pulse" />
          <div className="h-14 w-1/2 bg-white/15 rounded-xl animate-pulse" />
          <div className="h-4 w-2/3 bg-white/10 rounded-md animate-pulse" />
        </Container>
      </div>

      <Container className="py-12">
        <div className="h-24 rounded-3xl border border-ink/8 bg-stone-50 animate-pulse" />
      </Container>

      <Container className="pb-8">
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 w-32 rounded-full bg-stone-100 animate-pulse" />
          ))}
        </div>
      </Container>

      <Container size="wide" className="py-8">
        <SkeletonProductGrid count={10} light />
      </Container>
    </div>
  );
}
