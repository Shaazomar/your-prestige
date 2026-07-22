import type { Metadata } from "next";
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
  title: {
    default: `${business.name} — Luxury Tiles & Sanitaryware, Mangaluru`,
    template: `%s — ${business.name}`,
  },
  description: business.description,
  keywords: [
    "luxury tiles Mangaluru",
    "premium sanitaryware Mangaluru",
    "designer bathrooms Karnataka",
    "tile showroom Dakshina Kannada",
    "Italian marble tiles Mangalore",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: business.name,
    title: `${business.name} — Luxury Tiles & Sanitaryware`,
    description: business.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${business.name} — Luxury Tiles & Sanitaryware`,
    description: business.description,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${manrope.variable} ${instrument.variable} grain antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
