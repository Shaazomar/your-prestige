import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-canvas pt-24">
      <Container size="wide" className="space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32 bg-stone-200/70" />
          <Skeleton className="h-10 w-1/2 bg-stone-200/70" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-line bg-surface overflow-hidden p-4 space-y-4">
              <Skeleton className="aspect-[16/10] w-full rounded-xl bg-stone-200/70" />
              <Skeleton className="h-4 w-1/4 bg-stone-200/70" />
              <Skeleton className="h-6 w-3/4 bg-stone-200/70" />
              <Skeleton className="h-4 w-1/2 bg-stone-200/70" />
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
