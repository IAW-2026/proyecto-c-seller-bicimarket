import { prisma } from "@/lib/prisma";
import { Errors, requireSellerProfile } from "@/lib/api-utils";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ productId: string; imageId: string }> }
) {
  const { profile, error } = await requireSellerProfile();
  if (error) return error;

  const { productId, imageId } = await params;

  const product = await prisma.product.findFirst({
    where: { id: productId, sellerProfileId: profile!.id, deletedAt: null },
  });
  if (!product) return Errors.notFound("Product");

  const image = await prisma.productImage.findFirst({
    where: { id: imageId, productId },
  });
  if (!image) return Errors.notFound("Image");

  await prisma.productImage.delete({ where: { id: imageId } });

  return new Response(null, { status: 204 });
}
