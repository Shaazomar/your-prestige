import { NextResponse, type NextRequest } from "next/server";
import { products, type CatalogProduct } from "@/lib/catalog";


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("query")?.toLowerCase();
  const category = searchParams.get("category");
  const collection = searchParams.get("collection");
  const finish = searchParams.get("finish");
  const color = searchParams.get("color");
  const application = searchParams.get("application");
  const inStockOnly = searchParams.get("inStock") === "true";
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const page = parseInt(searchParams.get("page") || "1", 10);

  let filtered: CatalogProduct[] = [...products];

  if (query) {
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.slug.toLowerCase().includes(query) ||
        p.collection.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.color.toLowerCase().includes(query) ||
        p.finish.toLowerCase().includes(query) ||
        p.applications.some((app) => app.toLowerCase().includes(query))
    );
  }

  if (category) {
    filtered = filtered.filter((p) => p.category === category);
  }

  if (collection) {
    filtered = filtered.filter((p) => p.collection.toLowerCase() === collection.toLowerCase());
  }

  if (finish) {
    filtered = filtered.filter((p) => p.finish.toLowerCase().includes(finish.toLowerCase()));
  }

  if (color) {
    filtered = filtered.filter((p) => p.color.toLowerCase().includes(color.toLowerCase()));
  }

  if (application) {
    filtered = filtered.filter((p) =>
      p.applications.some((a) => a.toLowerCase().includes(application.toLowerCase()))
    );
  }

  if (inStockOnly) {
    filtered = filtered.filter((p) => !("inStock" in p) || Boolean(p["inStock" as keyof CatalogProduct]));
  }



  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return NextResponse.json({
    success: true,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    data: paginated,
  });
}
