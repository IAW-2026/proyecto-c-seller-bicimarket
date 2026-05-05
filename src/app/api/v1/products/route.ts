import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  Errors,
  getPaginationParams,
  paginatedResponse,
  requireSellerProfile,
} from "@/lib/api-utils";
import { Prisma, ProductStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const category = url.searchParams.get("category");
  const brand = url.searchParams.get("brand");
  const condition = url.searchParams.get("condition");
  const sellerId = url.searchParams.get("seller_id");
  const minPrice = url.searchParams.get("min_price_cents");
  const maxPrice = url.searchParams.get("max_price_cents");
  const sort = url.searchParams.get("sort") ?? "-created_at";
  const { page, limit, skip } = getPaginationParams(request);

  const where: Prisma.ProductWhereInput = {
    status: ProductStatus.active,
    deletedAt: null,
    ...(q && { title: { contains: q, mode: "insensitive" } }),
    ...(category && { category: category as never }),
    ...(brand && { brand: { equals: brand, mode: "insensitive" } }),
    ...(condition && { condition: condition as never }),
    ...(sellerId && { sellerProfileId: sellerId }),
    ...(minPrice && { priceCents: { gte: parseInt(minPrice, 10) } }),
    ...(maxPrice && {
      priceCents: {
        ...(minPrice ? { gte: parseInt(minPrice, 10) } : {}),
        lte: parseInt(maxPrice, 10),
      },
    }),
  };

  const orderBy = sort.startsWith("-")
    ? { [sort.slice(1).replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())]: "desc" as const }
    : { [sort.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())]: "asc" as const };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { images: { orderBy: { position: "asc" }, take: 1 } },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  const data = products.map((p) => ({
    id: p.id,
    seller_profile_id: p.sellerProfileId,
    title: p.title,
    brand: p.brand,
    model: p.model,
    category: p.category,
    price_cents: p.priceCents,
    currency: p.currency,
    weight_grams: p.weightGrams,
    dimensions_cm:
      p.lengthCm && p.widthCm && p.heightCm
        ? { length: p.lengthCm, width: p.widthCm, height: p.heightCm }
        : null,
    status: p.status,
    main_image_url: p.images[0]?.url ?? null,
    created_at: p.createdAt,
  }));

  return Response.json(paginatedResponse(data, total, page, limit));
}

export async function POST(request: NextRequest) {
  const { profile, error } = await requireSellerProfile();
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Errors.badRequest("Invalid JSON body");
  }

  const {
    title,
    description,
    brand,
    model,
    category,
    condition,
    price_cents,
    currency = "ARS",
    weight_grams,
    dimensions_cm,
  } = body as Record<string, unknown>;

  if (!title || !description || !brand || !model || !category || !condition || !price_cents || !weight_grams) {
    return Errors.badRequest("title, description, brand, model, category, condition, price_cents, and weight_grams are required");
  }

  const dims = dimensions_cm as Record<string, number> | null | undefined;

  const product = await prisma.product.create({
    data: {
      sellerProfileId: profile!.id,
      title: String(title),
      description: String(description),
      brand: String(brand),
      model: String(model),
      category: category as never,
      condition: condition as never,
      priceCents: Number(price_cents),
      currency: String(currency),
      weightGrams: Number(weight_grams),
      ...(dims && {
        lengthCm: dims.length,
        widthCm: dims.width,
        heightCm: dims.height,
      }),
    },
    include: { images: true },
  });

  return Response.json(formatProduct(product), { status: 201 });
}

export function formatProduct(p: {
  id: string;
  sellerProfileId: string;
  title: string;
  description: string;
  brand: string;
  model: string;
  category: string;
  condition: string;
  priceCents: number;
  currency: string;
  weightGrams: number;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  status: string;
  createdAt: Date;
  images: { id: string; url: string; position: number }[];
}) {
  return {
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
  };
}
