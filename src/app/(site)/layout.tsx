import type { ReactNode } from "react";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { FloatingActions } from "@/components/site/FloatingActions";
import { LocalBusinessJsonLd } from "@/components/site/JsonLd";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <SmoothScroll>
      <LocalBusinessJsonLd />
      <Header />
      <main>{children}</main>
      <Footer />
      <FloatingActions />
    </SmoothScroll>
  );
}
