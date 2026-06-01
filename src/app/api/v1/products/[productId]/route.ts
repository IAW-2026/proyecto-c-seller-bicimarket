import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Errors, requireSellerProfile } from "@/lib/api-utils";
import { formatProduct } from "../_format";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;

  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
    include: {
      images: { orderBy: { position: "asc" } },
      sellerProfile: { select: { displayName: true } },
    },
  });
  if (!product) return Errors.notFound("Product");

  return Response.json({
    ...formatProduct(product),
    seller_display_name: product.sellerProfile.displayName,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { profile, error } = await requireSellerProfile();
  if (error) return error;

  const { productId } = await params;

  const product = await prisma.product.findFirst({
    where: { id: productId, sellerProfileId: profile!.id, deletedAt: null },
    include: { images: true },
  });
  if (!product) return Errors.notFound("Product");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Errors.badRequest("Invalid JSON body");
  }

  const { title, description, brand, model, category, condition, price_cents, weight_grams, dimensions_cm, status, discount_percent } =
    body as Record<string, unknown>;

  if (discount_percent != null) {
    const pct = Number(discount_percent);
    if (!Number.isInteger(pct) || pct < 0 || pct > 99) {
      return Errors.badRequest("discount_percent must be an integer between 0 and 99");
    }
  }

  // Validate activation requirements
  if (status === "active") {
    const imageCount = product.images.length;
    const newWeight = weight_grams != null ? Number(weight_grams) : product.weightGrams;
    const newPrice = price_cents != null ? Number(price_cents) : product.priceCents;

    if (imageCount === 0) {
      return Errors.unprocessable("VALIDATION_FAILED", "At least one image is required to activate", {
        images: "at least 1",
      });
    }
    if (!newWeight || newWeight <= 0) {
      return Errors.unprocessable("VALIDATION_FAILED", "weight_grams must be greater than 0 to activate", {
        weight_grams: "required",
      });
    }
    if (!newPrice || newPrice <= 0) {
      return Errors.unprocessable("VALIDATION_FAILED", "price_cents must be greater than 0 to activate", {
        price_cents: "required",
      });
    }
    if (profile!.verificationStatus !== "verified") {
      return Errors.unprocessable("SELLER_NOT_VERIFIED", "Seller profile must be verified to publish products");
    }
  }

  const dims = dimensions_cm as Record<string, number> | null | undefined;

  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      ...(title != null && { title: String(title) }),
      ...(description != null && { description: String(description) }),
      ...(brand != null && { brand: String(brand) }),
      ...(model != null && { model: String(model) }),
      ...(category != null && { category: category as never }),
      ...(condition != null && { condition: condition as never }),
      ...(price_cents != null && { priceCents: Number(price_cents) }),
      ...(weight_grams != null && { weightGrams: Number(weight_grams) }),
      ...(dims && {
        lengthCm: dims.length,
        widthCm: dims.width,
        heightCm: dims.height,
      }),
      ...(status != null && { status: status as never }),
      ...(discount_percent != null && { discountPercent: Number(discount_percent) }),
    },
    include: { images: { orderBy: { position: "asc" } } },
  });

  return Response.json(formatProduct(updated));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { profile, error } = await requireSellerProfile();
  if (error) return error;

  const { productId } = await params;

  const product = await prisma.product.findFirst({
    where: { id: productId, sellerProfileId: profile!.id, deletedAt: null },
  });
  if (!product) return Errors.notFound("Product");

  await prisma.product.update({
    where: { id: productId },
    data: { status: "archived", deletedAt: new Date() },
  });

  return new Response(null, { status: 204 });
}
