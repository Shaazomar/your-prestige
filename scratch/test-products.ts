import { prisma } from "../src/lib/prisma";

async function main() {
  try {
    console.log("Counting products...");
    const total = await prisma.product.count();
    console.log("Total products:", total);

    console.log("Fetching products...");
    const products = await prisma.product.findMany({
      include: { category: { select: { name: true } }, brand: { select: { name: true } } },
      take: 3,
    });
    console.log("Products:", JSON.stringify(products, null, 2));
  } catch (error) {
    console.error("Error fetching products:", error);
  }
}

main();
