import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { WishlistClient } from "./WishlistClient";

export const metadata: Metadata = {
  title: "Your Selection",
  description:
    "The tiles and sanitaryware you've saved while planning — request a quotation or book a showroom viewing for the whole selection.",
  // Nothing here is the same for two visitors, so there's nothing to index.
  robots: { index: false, follow: true },
};

export default function WishlistPage() {
  return (
    <>
      <PageHero
        eyebrow="Your Selection"
        title="The pieces you're considering."
        description="Saved on this device while you plan. Send them to us and we'll price the lot."
      />
      <WishlistClient />
    </>
  );
}
