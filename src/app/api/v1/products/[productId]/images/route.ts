import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Errors, requireSellerProfile } from "@/lib/api-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { profile, error } = await requireSellerProfile();
  if (error) return error;

  const { productId } = await params;

  const product = await prisma.product.findFirst({
    where: { id: productId, sellerProfileId: profile!.id, deletedAt: null },
    include: { images: { orderBy: { position: "desc" }, take: 1 } },
  });
  if (!product) return Errors.notFound("Product");

  // Parse multipart form or JSON with url field
  let url: string | null = null;
  let position: number | null = null;

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    // In a real implementation, upload the file to object storage and get the URL.
    // Here we accept a pre-signed URL via the 'url' field or a file field.
    const urlField = formData.get("url");
    const posField = formData.get("position");
    if (urlField) url = String(urlField);
    if (posField) position = parseInt(String(posField), 10);
  } else {
    const body = (await request.json()) as Record<string, unknown>;
    url = body.url ? String(body.url) : null;
    position = body.position != null ? Number(body.position) : null;
  }

  if (!url) {
    return Errors.badRequest("url is required (upload the file to storage first, then provide the public URL)");
  }

  const nextPosition = position ?? (product.images[0] ? product.images[0].position + 1 : 0);

  const image = await prisma.productImage.create({
    data: { productId, url, position: nextPosition },
  });

  return Response.json(
    { id: image.id, product_id: image.productId, url: image.url, position: image.position },
    { status: 201 }
  );
}
