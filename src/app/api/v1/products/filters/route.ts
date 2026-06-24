import { prisma } from "@/lib/prisma";
import { ProductStatus } from "@prisma/client";

export async function GET() {
  const where = { status: ProductStatus.active, deletedAt: null };

  const [brands, categories, conditions, priceAgg, sellers] = await Promise.all([
    prisma.product.findMany({
      where,
      select: { brand: true },
      distinct: ["brand"],
      orderBy: { brand: "asc" },
    }),
    prisma.product.groupBy({
      by: ["category"],
      where,
      _count: { id: true },
      orderBy: { category: "asc" },
    }),
    prisma.product.groupBy({
      by: ["condition"],
      where,
      _count: { id: true },
    }),
    prisma.product.aggregate({
      where,
      _min: { priceCents: true },
      _max: { priceCents: true },
    }),
    prisma.sellerProfile.findMany({
      where: {
        products: { some: where },
      },
      select: { id: true, displayName: true },
      orderBy: { displayName: "asc" },
    }),
  ]);

  return Response.json({
    brands: brands.map((b) => b.brand),
    categories: categories.map((c) => ({ value: c.category, count: c._count.id })),
    conditions: conditions.map((c) => ({ value: c.condition, count: c._count.id })),
    price_range_cents: {
      min: priceAgg._min.priceCents ?? 0,
      max: priceAgg._max.priceCents ?? 0,
    },
    sellers: sellers.map((s) => ({ id: s.id, display_name: s.displayName })),
  });
}
