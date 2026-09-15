import type { Metadata, Viewport } from "next";
import { Manrope, Instrument_Serif } from "next/font/google";
import { business, siteUrl } from "@/lib/site-config";
import { DEFAULT_TITLE, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, DEFAULT_TWITTER_IMAGE } from "@/lib/seo-config";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: business.name,
  title: {
    // Prestige is not a tile-only business — the catalogue spans tiles and
    // surfaces plus bathware, sanitaryware, faucets, showers and wellness, so
    // the default title describes all of it. Page-level generators return
    // absolute titles and bypass this template.
    default: DEFAULT_TITLE,
    template: `%s — ${business.name}`,
  },
  description: DEFAULT_DESCRIPTION,
  // Deliberately short and non-repetitive: a keyword list is not a ranking
  // signal, and a long one reads as stuffing.
  keywords: [
    "tiles Mangaluru",
    "sanitaryware Mangaluru",
    "bathware Mangaluru",
    "Jaquar dealer Mangaluru",
    "premium surfaces Dakshina Kannada",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: business.name,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_TWITTER_IMAGE],
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.webmanifest",
  appleWebApp: { title: "Prestige", capable: true, statusBarStyle: "black-translucent" },
};

// Prestige 2.0 is a single dark theme, so the browser chrome matches it
// unconditionally rather than tracking the OS preference.
export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${instrument.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
