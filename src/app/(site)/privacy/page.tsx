import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { Container } from "@/components/ui/Container";
import { LegalBody } from "@/components/site/LegalBody";
import { getBusiness } from "@/lib/business";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Prestige Tiles & Sanitary collects, uses and protects the personal information you share with us.",
};

export const revalidate = 86400;

export default async function PrivacyPage() {
  const business = await getBusiness();
  const contact = business.email || business.phone;

  return (
    <main className="bg-canvas">
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        description="What we collect, why we collect it, and the choices you have."
      />

      <Container size="narrow" className="section-sm">
        <LegalBody>
          <p className="lead">
            This policy explains how {business.legalName} (&ldquo;we&rdquo;,
            &ldquo;us&rdquo;) handles personal information collected through this
            website.
          </p>

          <h2>Information we collect</h2>
          <p>We collect information only when you choose to give it to us:</p>
          <ul>
            <li>
              <strong>Enquiries and quotation requests</strong> — your name, phone
              number, and optionally your email address, city, budget range,
              product interest and any message you write.
            </li>
            <li>
              <strong>Showroom visit bookings</strong> — the above, plus your
              preferred date, time and branch.
            </li>
            <li>
              <strong>Newsletter</strong> — your email address only.
            </li>
            <li>
              <strong>Usage data</strong> — if analytics are enabled, standard
              measurement data such as pages viewed, approximate region, referring
              site and device type.
            </li>
          </ul>
          <p>
            We do not sell products online and do not collect payment card
            details through this website.
          </p>

          <h2>How we use it</h2>
          <ul>
            <li>To respond to your enquiry and prepare a quotation.</li>
            <li>To confirm and manage showroom appointments.</li>
            <li>
              To send catalogue and collection updates, where you have asked to
              receive them.
            </li>
            <li>To understand which pages are useful and improve the site.</li>
          </ul>
          <p>
            We do not sell your personal information, and we do not share it with
            third parties for their own marketing.
          </p>

          <h2>Storage and retention</h2>
          <p>
            Enquiry and booking records are held in our customer database for as
            long as needed to serve you and to meet our record-keeping
            obligations. Newsletter subscriptions are held until you unsubscribe.
          </p>

          <h2>Your choices</h2>
          <ul>
            <li>
              <strong>Unsubscribe</strong> — every newsletter includes an
              unsubscribe link, and you can ask us to remove you at any time.
            </li>
            <li>
              <strong>Access, correction and deletion</strong> — write to us and
              we will confirm what we hold about you, correct it, or delete it
              where we are not required to keep it.
            </li>
            <li>
              <strong>Cookies</strong> — your browser can block or clear cookies.
              The site works without analytics cookies.
            </li>
          </ul>

          <h2>Contact</h2>
          <p>
            For any privacy question or request, contact us at{" "}
            <strong>{contact}</strong>
            {business.address ? <>, or write to us at {business.address}</> : null}.
          </p>
        </LegalBody>
      </Container>
    </main>
  );
}
