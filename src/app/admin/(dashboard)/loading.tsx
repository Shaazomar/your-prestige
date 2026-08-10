import { Skeleton, SkeletonTable } from "@/components/ui/Skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-pulse p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 bg-white/10" />
        <Skeleton className="h-4 w-96 bg-white/10" />
      </div>

      {/* Grid Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/8 bg-[#141413] p-6 space-y-4">
            <Skeleton className="h-4 w-1/3 bg-white/10" />
            <Skeleton className="h-8 w-1/2 bg-white/10" />
          </div>
        ))}
      </div>

      {/* Main layout */}
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="rounded-2xl border border-white/8 bg-[#141413] p-6 xl:col-span-3 space-y-6">
          <Skeleton className="h-6 w-1/3 bg-white/10" />
          <SkeletonTable rows={5} cols={3} />
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#141413] p-6 xl:col-span-2 space-y-4">
          <Skeleton className="h-6 w-1/2 bg-white/10" />
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-xl bg-white/10" />
            <Skeleton className="h-16 w-full rounded-xl bg-white/10" />
            <Skeleton className="h-16 w-full rounded-xl bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
