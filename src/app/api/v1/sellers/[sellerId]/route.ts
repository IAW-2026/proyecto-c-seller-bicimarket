import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Errors, requireAdmin } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sellerId: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { sellerId } = await params;

  const [profile, productCount] = await Promise.all([
    prisma.sellerProfile.findUnique({ where: { id: sellerId } }),
    prisma.product.count({ where: { sellerProfileId: sellerId, deletedAt: null } }),
  ]);

  if (!profile) return Errors.notFound("Seller");

  return Response.json({
    id: profile.id,
    clerk_user_id: profile.clerkUserId,
    legal_name: profile.legalName,
    display_name: profile.displayName,
    tax_id: profile.taxId,
    tax_condition: profile.taxCondition,
    bank_account_reference: profile.bankAccountReference,
    pickup_address: profile.pickupAddress,
    verification_status: profile.verificationStatus,
    created_at: profile.createdAt,
    updated_at: profile.updatedAt,
    product_count: productCount,
  });
}
