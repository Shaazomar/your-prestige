import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/site/PageHero";
import { applicationsData } from "@/lib/applications";



export const metadata = {
  title: "Applications & Environments | Prestige Tiles",
  description: "Browse luxury tile and sanitaryware surfaces categorized across 10 architectural applications.",
};

export default function ApplicationsHubPage() {
  return (
    <main className="min-h-screen bg-white">
      <PageHero
        eyebrow="Architectural Scope"
        title="Application Environments"
        description="Whether specifying for a grand living foyer, a high-traffic airport lounge, or a luxury wellness spa, explore surfaces tailored by performance requirements."
      />

      <section className="py-20 md:py-28">
        <Container size="wide">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {applicationsData.map((app) => (
              <div
                key={app.slug}
                className="group relative rounded-2xl bg-white border border-stone-200 overflow-hidden shadow-soft hover:shadow-float hover:border-accent transition-all duration-300 flex flex-col justify-between"
              >
                <div className="relative h-64 w-full overflow-hidden bg-stone-100">
                  <Image
                    src={app.image}
                    alt={app.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="rounded-full bg-black/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent backdrop-blur-md border border-white/10">
                      {app.count}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-ink mb-2 group-hover:text-ink">
                      {app.title}
                    </h3>
                    <p className="text-xs text-slate-warm leading-relaxed mb-6">
                      {app.description}
                    </p>
                  </div>

                  <Link
                    href={`/applications/${app.slug}`}
                    className="inline-flex items-center justify-between w-full rounded-xl bg-offwhite px-4 py-3 text-xs font-bold uppercase tracking-wider text-ink hover:bg-accent hover:text-ink transition-colors border border-stone-200"
                  >
                    <span>Browse {app.title}</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}
