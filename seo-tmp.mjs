import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const prod = await p.product.findUnique({ where: { slug: "basalt-noir-matte" } });
await p.seo.upsert({
  where: { path: "/products/tiles/basalt-noir-matte" },
  update: { title: "EDITOR OVERRIDE — Basalt Noir", description: "Copy written by the SEO team.", keywords: "basalt, noir, matt tile" },
  create: { path: "/products/tiles/basalt-noir-matte", title: "EDITOR OVERRIDE — Basalt Noir", description: "Copy written by the SEO team.", keywords: "basalt, noir, matt tile", productId: prod.id },
});
console.log("Seo override written");
await p.$disconnect();
