import { prisma } from "@/lib/prisma";
import { Errors } from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;

  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
    include: { sellerProfile: { select: { id: true, verificationStatus: true } } },
  });
  if (!product) return Errors.notFound("Product");

  const available =
    product.status === "active" && product.sellerProfile.verificationStatus === "verified";

  return Response.json({
    product_id: product.id,
    seller_profile_id: product.sellerProfileId,
    status: product.status,
    available,
    unit_price_cents: Math.round(product.priceCents * (1 - product.discountPercent / 100)),
    currency: product.currency,
    weight_grams: product.weightGrams,
    dimensions_cm:
      product.lengthCm && product.widthCm && product.heightCm
        ? { length: product.lengthCm, width: product.widthCm, height: product.heightCm }
        : null,
    checked_at: new Date().toISOString(),
  });
}
