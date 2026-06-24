import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin, PRODUCT_IMAGES_BUCKET } from "@/lib/supabase";
import { Errors, requireAdmin } from "@/lib/api-utils";

// ── Delete any image of any product (admin) ──────────────────────────────────
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ productId: string; imageId: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { productId, imageId } = await params;

  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
  });
  if (!product) return Errors.notFound("Product");

  const image = await prisma.productImage.findFirst({
    where: { id: imageId, productId },
  });
  if (!image) return Errors.notFound("Image");

  // Best-effort cleanup of the stored object (only for images we host on Supabase).
  const marker = `/${PRODUCT_IMAGES_BUCKET}/`;
  const idx = image.url.indexOf(marker);
  if (idx !== -1) {
    const storagePath = image.url.slice(idx + marker.length);
    const { error: storageError } = await getSupabaseAdmin()
      .storage.from(PRODUCT_IMAGES_BUCKET)
      .remove([storagePath]);
    if (storageError) {
      console.error("Supabase Storage remove error:", storageError.message);
    }
  }

  await prisma.productImage.delete({ where: { id: imageId } });

  return new Response(null, { status: 204 });
}
