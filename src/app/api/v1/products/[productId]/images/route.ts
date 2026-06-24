import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin, PRODUCT_IMAGES_BUCKET } from "@/lib/supabase";
import { Errors, requireSellerProfile } from "@/lib/api-utils";
import { newId } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

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

  const idempotencyKey = request.headers.get("Idempotency-Key");
  if (idempotencyKey) {
    const existing = await prisma.productImage.findUnique({ where: { idempotencyKey } });
    if (existing) {
      return Response.json(
        { id: existing.id, product_id: existing.productId, url: existing.url, position: existing.position }
      );
    }
  }

  const contentType = request.headers.get("content-type") ?? "";
  const nextPosition = product.images[0] ? product.images[0].position + 1 : 0;

  // ── URL mode ──────────────────────────────────────────────────
  if (contentType.includes("application/json")) {
    const body = await request.json() as { url?: string; position?: number };
    const url = body.url?.trim();
    if (!url) return Errors.badRequest("url field is required");
    try { new URL(url); } catch { return Errors.badRequest("Invalid URL"); }

    const position = body.position != null ? Number(body.position) : nextPosition;
    const image = await prisma.productImage.create({
      data: { id: newId("img"), productId, url, position, ...(idempotencyKey && { idempotencyKey }) },
    });
    return Response.json(
      { id: image.id, product_id: image.productId, url: image.url, position: image.position },
      { status: 201 }
    );
  }

  // ── File upload mode ──────────────────────────────────────────
  if (!contentType.includes("multipart/form-data")) {
    return Errors.badRequest("Content-Type must be multipart/form-data or application/json");
  }

  const formData = await request.formData();
  const fileField = formData.get("file");
  const posField = formData.get("position");

  if (!(fileField instanceof File)) {
    return Errors.badRequest("file field is required");
  }

  if (!ALLOWED_TYPES.includes(fileField.type)) {
    return Errors.badRequest("Only JPEG, PNG, WebP, and GIF images are accepted");
  }

  if (fileField.size > MAX_BYTES) {
    return Errors.badRequest("File exceeds the 5 MB limit");
  }

  const ext = (fileField.name.split(".").pop() ?? "jpg").toLowerCase();
  const storagePath = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = await fileField.arrayBuffer();

  const { error: uploadError } = await getSupabaseAdmin().storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(storagePath, buffer, { contentType: fileField.type, upsert: false });

  if (uploadError) {
    console.error("Supabase Storage upload error:", uploadError.message);
    return Response.json(
      { error: { code: "STORAGE_ERROR", message: "Failed to upload image to storage" } },
      { status: 502 }
    );
  }

  const { data: publicUrlData } = getSupabaseAdmin().storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(storagePath);

  const position =
    posField != null ? parseInt(String(posField), 10) : nextPosition;

  const image = await prisma.productImage.create({
    data: {
      id: newId("img"),
      productId,
      url: publicUrlData.publicUrl,
      position,
      ...(idempotencyKey && { idempotencyKey }),
    },
  });

  return Response.json(
    { id: image.id, product_id: image.productId, url: image.url, position: image.position },
    { status: 201 }
  );
}
