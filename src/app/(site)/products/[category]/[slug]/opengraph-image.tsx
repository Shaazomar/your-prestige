import { ImageResponse } from "next/og";
import { getCatalogProduct } from "@/lib/products";

/**
 * Per-product social card.
 *
 * `ImageResponse` ships with Next, so this needs no extra dependency. The card
 * is composed rather than screenshotted: the product photograph fills the
 * frame with a scrim over it, and the name, collection and specs are drawn as
 * text — which stays legible at the small sizes these actually appear in, and
 * doesn't depend on a headless browser at build time.
 */

export const alt = "Prestige Tiles & Sanitary";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { category: string; slug: string } }) {
  const product = await getCatalogProduct(params.slug);

  // Fall back to the site card rather than failing the route — a missing OG
  // image breaks link previews everywhere the URL is shared.
  if (!product) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%", height: "100%", display: "flex",
            alignItems: "center", justifyContent: "center",
            background: "#0c0c0b", color: "#F5F2EC", fontSize: 64, letterSpacing: -2,
          }}
        >
          PRESTIGE
        </div>
      ),
      size
    );
  }

  const specs = [product.finish, product.sizes[0], product.thickness]
    .filter((s) => s && s !== "—")
    .join("  ·  ");

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#0c0c0b" }}>
        {/* Satori has no `inset` shorthand — every absolutely positioned layer
            needs explicit top/left/width/height or it collapses and the scrim
            silently disappears, leaving the text unreadable over the photo. */}
        <img
          src={product.lifestyleImage}
          alt=""
          width={size.width}
          height={size.height}
          style={{
            position: "absolute", top: 0, left: 0,
            width: size.width, height: size.height, objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "absolute", top: 0, left: 0,
            width: size.width, height: size.height, display: "flex",
            background:
              "linear-gradient(90deg, rgba(10,10,9,0.97) 0%, rgba(10,10,9,0.92) 38%, rgba(10,10,9,0.62) 68%, rgba(10,10,9,0.25) 100%)",
          }}
        />
        <div
          style={{
            position: "relative", display: "flex", flexDirection: "column",
            justifyContent: "center", padding: "72px", maxWidth: 760, height: "100%",
          }}
        >
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 6, color: "#b3915a", textTransform: "uppercase" }}>
            {product.brand}
          </div>
          <div style={{ display: "flex", fontSize: 78, color: "#F5F2EC", lineHeight: 1.05, marginTop: 18, letterSpacing: -2 }}>
            {product.name}
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "rgba(245,242,236,0.62)", marginTop: 16 }}>
            {product.collection}
          </div>
          {specs && (
            <div style={{ display: "flex", fontSize: 24, color: "rgba(245,242,236,0.45)", marginTop: 28 }}>
              {specs}
            </div>
          )}
          <div style={{ display: "flex", fontSize: 20, color: "rgba(245,242,236,0.4)", marginTop: 48, letterSpacing: 3 }}>
            PRESTIGE TILES &amp; SANITARY  ·  MANGALURU
          </div>
        </div>
      </div>
    ),
    size
  );
}
