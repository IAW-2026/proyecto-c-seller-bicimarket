import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Errors, requireSellerProfile, getPaginationParams, paginatedResponse } from "@/lib/api-utils";
import { formatProduct } from "@/app/api/v1/products/_format";

// Authenticated endpoint: returns ALL products for the logged-in seller (all statuses).
export async function GET(request: NextRequest) {
  const { profile, error } = await requireSellerProfile();
  if (error) return error;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const { page, limit, skip } = getPaginationParams(request);

  const where = {
    sellerProfileId: profile!.id,
    OR: [{ deletedAt: null }, { status: "archived" as const }],
    ...(status && { status: status as never }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { images: { orderBy: { position: "asc" } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return Response.json(paginatedResponse(products.map(formatProduct), total, page, limit));
}
