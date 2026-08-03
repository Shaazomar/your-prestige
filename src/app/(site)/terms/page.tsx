import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { Container } from "@/components/ui/Container";
import { LegalBody } from "@/components/site/LegalBody";
import { getBusiness } from "@/lib/business";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "The terms on which Prestige Tiles & Sanitary makes this website and its catalogue available.",
};

export const revalidate = 86400;

export default async function TermsPage() {
  const business = await getBusiness();
  const contact = business.email || business.phone;

  return (
    <main className="bg-canvas">
      <PageHero
        eyebrow="Legal"
        title="Terms of Use"
        description="The basis on which this website and its catalogue are provided."
      />

      <Container size="narrow" className="section-sm">
        <LegalBody>
          <p className="lead">
            By using this website you accept these terms. If you do not accept
            them, please do not use the site.
          </p>

          <h2>The catalogue is a showcase, not an offer</h2>
          <p>
            This website presents our range for reference. It is not an online
            store, and nothing here constitutes a binding offer to sell. Product
            availability, sizes, finishes and pricing are confirmed only in a
            written quotation from us.
          </p>

          <h2>Colour and finish</h2>
          <p>
            Tiles, stone and sanitaryware are natural and manufactured products.
            Shade, veining and texture vary between batches, and screens
            reproduce colour imperfectly. Photographs on this site are
            indicative. Please inspect physical samples at a showroom before
            confirming an order.
          </p>

          <h2>Quotations and orders</h2>
          <ul>
            <li>
              Quotations are valid for the period stated on them and are subject
              to stock at the time of order confirmation.
            </li>
            <li>
              Quantities shown in any estimate exclude wastage and cutting
              allowance unless stated otherwise.
            </li>
            <li>
              Orders, delivery, returns and warranty are governed by the terms on
              the quotation and invoice, not by this page.
            </li>
          </ul>

          <h2>Intellectual property</h2>
          <p>
            The site&rsquo;s text, photography, layout and design are owned by{" "}
            {business.legalName} or used under licence, and may not be
            reproduced without permission. Brand names and logos shown belong to
            their respective owners and are used to identify the products we
            supply.
          </p>

          <h2>Third-party content</h2>
          <p>
            Technical sheets, catalogues and specifications supplied by
            manufacturers are provided as received. We are not responsible for
            errors in manufacturer documentation, and links to external sites are
            not endorsements.
          </p>

          <h2>Availability</h2>
          <p>
            We aim to keep the site available and accurate, but we do not
            guarantee uninterrupted access, and content may be changed or removed
            at any time without notice.
          </p>

          <h2>Governing law</h2>
          <p>
            These terms are governed by the laws of India, and the courts at
            Mangaluru, Karnataka shall have jurisdiction.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about these terms: <strong>{contact}</strong>.
          </p>
        </LegalBody>
      </Container>
    </main>
  );
}
