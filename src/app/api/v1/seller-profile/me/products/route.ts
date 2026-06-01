import { prisma } from "@/lib/prisma";
import { getPaginationParams, paginatedResponse, requireSellerProfile } from "@/lib/api-utils";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { profile, error } = await requireSellerProfile();
  if (error) return error;

  const { page, limit, skip } = getPaginationParams(request);

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: { sellerProfileId: profile!.id, deletedAt: null },
      include: { images: { orderBy: { position: "asc" } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.product.count({
      where: { sellerProfileId: profile!.id, deletedAt: null },
    }),
  ]);

  const data = products.map((p) => ({
    id: p.id,
    seller_profile_id: p.sellerProfileId,
    title: p.title,
    description: p.description,
    brand: p.brand,
    model: p.model,
    category: p.category,
    condition: p.condition,
    price_cents: p.priceCents,
    currency: p.currency,
    weight_grams: p.weightGrams,
    dimensions_cm:
      p.lengthCm && p.widthCm && p.heightCm
        ? { length: p.lengthCm, width: p.widthCm, height: p.heightCm }
        : null,
    status: p.status,
    images: p.images.map((img) => ({ id: img.id, url: img.url, position: img.position })),
    created_at: p.createdAt,
  }));

  return Response.json(paginatedResponse(data, total, page, limit));
}
