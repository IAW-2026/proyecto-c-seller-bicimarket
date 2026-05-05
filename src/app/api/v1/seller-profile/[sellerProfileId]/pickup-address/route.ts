import { prisma } from "@/lib/prisma";
import { Errors, requireServiceToken } from "@/lib/api-utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sellerProfileId: string }> }
) {
  const tokenError = requireServiceToken(request);
  if (tokenError) return tokenError;

  const { sellerProfileId } = await params;

  const profile = await prisma.sellerProfile.findUnique({
    where: { id: sellerProfileId },
    select: { id: true, pickupAddress: true },
  });
  if (!profile) return Errors.notFound("Seller profile");

  return Response.json({
    seller_profile_id: profile.id,
    pickup_address: profile.pickupAddress,
  });
}
