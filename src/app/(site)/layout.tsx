import type { ReactNode } from "react";
import { cookies, headers } from "next/headers";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { FloatingActions } from "@/components/site/FloatingActions";
import { OrganizationJsonLd } from "@/components/site/JsonLd";
import { MaintenancePage } from "@/components/site/MaintenancePage";
import { getMaintenanceState, getMaintenanceWhitelist, isValidBypassToken, MAINTENANCE_COOKIE } from "@/lib/maintenance";
import { getBusiness } from "@/lib/business";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const state = await getMaintenanceState();

  if (state.enabled) {
    const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
    const hasBypass = isValidBypassToken(cookieStore.get(MAINTENANCE_COOKIE)?.value);

    if (!hasBypass) {
      const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
      const whitelist = await getMaintenanceWhitelist();
      const isWhitelisted = ip ? whitelist.includes(ip) : false;

      if (!isWhitelisted) {
        return <MaintenancePage message={state.message} countdownUntil={state.countdownUntil} />;
      }
    }
  }

  const business = await getBusiness();

  return (
    <SmoothScroll>
      <OrganizationJsonLd />
      <Header
        business={{ name: business.name, phone: business.phone, address: business.address }}
      />
      <main>{children}</main>
      <Footer />
      <FloatingActions whatsapp={business.whatsapp} phone={business.phone} />
    </SmoothScroll>
  );
}
