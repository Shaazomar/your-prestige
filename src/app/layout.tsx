import type { Metadata, Viewport } from "next";
import { Manrope, Instrument_Serif } from "next/font/google";
import { business, siteUrl } from "@/lib/site-config";
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
    default: `${business.name} — ${business.tagline}`,
    template: `%s — ${business.name}`,
  },
  description: business.description,
  keywords: [
    "Prestige Tiles Mangaluru",
    "luxury tiles Mangaluru",
    "premium sanitaryware Mangaluru",
    "Jaquar dealer Mangaluru",
    "designer bathrooms Karnataka",
    "tile showroom Dakshina Kannada",
    "tiles Puttur",
    "sanitaryware Moodbidri",
    "tile showroom Derlakatte",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: business.name,
    title: `${business.name} — ${business.tagline}`,
    description: business.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${business.name} — ${business.tagline}`,
    description: business.description,
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
