import { brands } from "@/lib/demo-content";
import { Reveal } from "@/components/motion/Reveal";

/** Infinite marquee of partner houses — typographic wordmarks, gallery-wall feel. */
export function BrandWall() {
  const row = [...brands, ...brands];

  return (
    <section className="border-y hairline bg-porcelain py-16 md:py-20">
      <Reveal direction="none">
        <p className="text-eyebrow mb-12 text-center text-stone-400">
          Partnered with 40+ of the world&apos;s finest houses
        </p>
      </Reveal>
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="animate-marquee flex w-max items-center">
          {row.map((brand, i) => (
            <span
              key={`${brand}-${i}`}
              className="mx-10 text-2xl font-semibold tracking-tight text-stone-300 transition-colors duration-500 hover:text-ink md:mx-14 md:text-3xl"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
