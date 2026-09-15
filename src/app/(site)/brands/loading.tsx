import { Container } from "@/components/ui/Container";

export default function BrandsLoading() {
  return (
    <div className="bg-white min-h-screen">
      <div className="bg-secondary py-20 border-b border-line">
        <Container size="wide" className="space-y-4">
          <div className="h-3 w-24 bg-stone-200/70 rounded-full animate-pulse" />
          <div className="h-10 w-2/3 bg-stone-200/70 rounded-xl animate-pulse" />
          <div className="h-4 w-1/2 bg-stone-200/70 rounded-md animate-pulse" />
        </Container>
      </div>

      <section className="py-24 md:py-32">
        <Container size="wide">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-stone-200 bg-stone-100 md:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] bg-stone-50 animate-pulse" />
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}
