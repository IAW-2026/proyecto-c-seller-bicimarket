import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Errors, requireAdmin, getPaginationParams, paginatedResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const category = url.searchParams.get("category");
  const search = url.searchParams.get("search")?.trim() || undefined;
  const sort = url.searchParams.get("sort") ?? "newest";
  const { page, limit, skip } = getPaginationParams(request);

  const orderBy =
    sort === "title_asc"
      ? { title: "asc" as const }
      : sort === "title_desc"
      ? { title: "desc" as const }
      : { createdAt: "desc" as const };

  const where = {
    deletedAt: null,
    ...(status && { status: status as never }),
    ...(category && { category: category as never }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { brand: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        sellerProfile: { select: { displayName: true } },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  const data = products.map((p) => ({
    id: p.id,
    title: p.title,
    brand: p.brand,
    model: p.model,
    category: p.category,
    condition: p.condition,
    price_cents: p.priceCents,
    currency: p.currency,
    weight_grams: p.weightGrams,
    status: p.status,
    seller_display_name: p.sellerProfile.displayName,
    seller_profile_id: p.sellerProfileId,
    created_at: p.createdAt,
  }));

  return Response.json(paginatedResponse(data, total, page, limit));
}
