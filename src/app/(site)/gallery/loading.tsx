import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function GalleryLoading() {
  return (
    <div className="bg-[#0a0a0a] min-h-screen pt-24 text-white">
      <Container size="wide" className="space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32 bg-white/10" />
          <Skeleton className="h-10 w-1/2 bg-white/10" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-2xl bg-white/10" />
          ))}
        </div>
      </Container>
    </div>
  );
}
