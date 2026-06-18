import { prisma } from "@/lib/prisma";
import { Errors, requireAdmin } from "@/lib/api-utils";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const [byCategory, byCondition, agg] = await Promise.all([
    prisma.product.groupBy({
      by: ["category"],
      where: { deletedAt: null },
      _count: { id: true },
    }),
    prisma.product.groupBy({
      by: ["condition"],
      where: { deletedAt: null },
      _count: { id: true },
    }),
    prisma.product.aggregate({
      where: { deletedAt: null },
      _count: { id: true },
      _avg: { priceCents: true },
    }),
  ]);

  return Response.json({
    total: agg._count.id,
    categories_count: byCategory.length,
    avg_price_cents: Math.round(Number(agg._avg.priceCents ?? 0)),
    by_category: byCategory.map((r) => ({ category: r.category, count: r._count.id })),
    by_condition: byCondition.map((r) => ({ condition: r.condition, count: r._count.id })),
  });
}
