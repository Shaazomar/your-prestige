import Image from "next/image";
import { ArrowDown } from "lucide-react";
import { Container } from "@/components/ui/Container";
import type { BrandView } from "@/lib/brands";

/**
 * Full-bleed brand hero. Video is optional and never blocks render — the
 * poster (or a cover image when there's no video at all) paints immediately,
 * and the `<video>` element itself streams in after. No JS is needed for any
 * of this: autoplay/muted/loop/playsInline is plain HTML, and the poster
 * *is* the graceful fallback while the video loads or if it never does.
 */
export function BrandHero({ brand }: { brand: BrandView }) {
  const poster = brand.heroPoster ?? brand.banner ?? brand.mobileCoverImage ?? undefined;
  const fallbackImage = brand.banner ?? brand.mobileCoverImage;

  return (
    <section className="relative flex h-[70vh] min-h-[420px] w-full items-end overflow-hidden bg-ink text-ivory md:h-[82vh]">
      <div className="absolute inset-0">
        {brand.heroVideo ? (
          <video
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster={poster}
            aria-hidden="true"
          >
            <source src={brand.heroVideo} />
          </video>
        ) : fallbackImage ? (
          <Image
            src={fallbackImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-ink to-ink/70" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/10" />
      </div>

      <Container size="wide" className="relative pb-16 pt-40 md:pb-24">
        {brand.logo && (
          <div className="relative mb-6 h-14 w-36">
            <Image src={brand.logo} alt="" fill sizes="144px" className="object-contain object-left brightness-0 invert" />
          </div>
        )}
        <p className="text-eyebrow mb-4 text-gold">Authorised Partner</p>
        <h1 className="text-display-lg max-w-3xl">{brand.name}</h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-ivory/70">
          {brand.description ?? `The complete ${brand.name} range, displayed at full scale across our Mangaluru showrooms.`}
        </p>
        <a
          href="#products"
          className="mt-9 inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-semibold text-ink transition-colors hover:bg-gold-bright"
        >
          Explore Products
          <ArrowDown className="h-4 w-4" />
        </a>
      </Container>
    </section>
  );
}
