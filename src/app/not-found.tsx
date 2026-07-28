import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Store, Search } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 py-20 text-center text-ivory">
      <Logo size="lg" tone="light" stacked />

      <p className="serif-accent mt-14 text-7xl text-gold md:text-8xl">404</p>
      <h1 className="text-display-sm mt-4 max-w-xl">
        This surface isn&apos;t in our collection.
      </h1>
      <p className="mt-5 max-w-md text-ivory/50">
        The page you&apos;re looking for has moved or never existed. Let us point you
        somewhere beautiful instead.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <ButtonLink href="/" variant="gold" size="lg">
          Back to Home
          <ArrowUpRight className="h-5 w-5" />
        </ButtonLink>
        <ButtonLink href="/products" variant="outline-light" size="lg">
          <Search className="h-4 w-4" />
          Browse the Catalogue
        </ButtonLink>
      </div>

      <Link
        href="/showrooms"
        className="mt-10 inline-flex items-center gap-2 text-sm text-ivory/45 transition-colors hover:text-gold"
      >
        <Store className="h-4 w-4" />
        Or visit one of our five showrooms
      </Link>
    </div>
  );
}
