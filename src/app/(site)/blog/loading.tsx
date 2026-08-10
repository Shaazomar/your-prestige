import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function BlogLoading() {
  return (
    <div className="bg-[#0a0a0a] min-h-screen pt-24 text-white">
      <Container size="wide" className="space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32 bg-white/10" />
          <Skeleton className="h-10 w-1/2 bg-white/10" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/5 bg-[#111] overflow-hidden p-4 space-y-4">
              <Skeleton className="aspect-[16/10] w-full rounded-xl bg-white/10" />
              <Skeleton className="h-4 w-1/4 bg-white/10" />
              <Skeleton className="h-6 w-3/4 bg-white/10" />
              <Skeleton className="h-4 w-1/2 bg-white/10" />
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
