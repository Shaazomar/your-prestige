import { Construction } from "lucide-react";

/** Premium empty state for CMS modules whose data layer is ready but UI is queued. */
export function ModuleStub({ title, note }: { title: string; note: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/12 bg-[#141413] px-8 py-20 text-center">
        <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10">
          <Construction className="h-6 w-6 text-gold" />
        </span>
        <h2 className="text-lg font-semibold">Module scaffolded</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-white/40">{note}</p>
      </div>
    </div>
  );
}
