import { prisma } from "@/lib/prisma";
import { Errors, requireServiceToken } from "@/lib/api-utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sellerProfileId: string }> }
) {
  const tokenError = requireServiceToken(request, "SHIPPING_TO_SELLER_SERVICE_TOKEN");
  if (tokenError) return tokenError;

  const { sellerProfileId } = await params;

  const profile = await prisma.sellerProfile.findUnique({
    where: { id: sellerProfileId },
  });
  if (!profile) return Errors.notFound("Seller profile");

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
  });
}
