import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Errors, requireAdmin } from "@/lib/api-utils";

const VALID_STATUSES = ["pending_review", "verified", "suspended"] as const;
type VerificationStatus = (typeof VALID_STATUSES)[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sellerProfileId: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { sellerProfileId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Errors.badRequest("Invalid JSON body");
  }

  const { status } = body as Record<string, unknown>;
  if (!status || !VALID_STATUSES.includes(status as VerificationStatus)) {
    return Errors.badRequest(`status must be one of: ${VALID_STATUSES.join(", ")}`);
  }

  const profile = await prisma.sellerProfile.findUnique({
    where: { id: sellerProfileId },
  });
  if (!profile) return Errors.notFound("Seller profile");

  const updated = await prisma.sellerProfile.update({
    where: { id: sellerProfileId },
    data: { verificationStatus: status as VerificationStatus },
  });

  return Response.json({
    id: updated.id,
    verification_status: updated.verificationStatus,
  });
}
