import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Errors, requireAdmin, getPaginationParams, paginatedResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const { page, limit, skip } = getPaginationParams(request);

  const where = status ? { verificationStatus: status as never } : {};

  const [profiles, total] = await Promise.all([
    prisma.sellerProfile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.sellerProfile.count({ where }),
  ]);

  const data = profiles.map((p) => ({
    id: p.id,
    clerk_user_id: p.clerkUserId,
    legal_name: p.legalName,
    display_name: p.displayName,
    tax_id: p.taxId,
    tax_condition: p.taxCondition,
    bank_account_reference: p.bankAccountReference,
    pickup_address: p.pickupAddress,
    verification_status: p.verificationStatus,
    created_at: p.createdAt,
  }));

  return Response.json(paginatedResponse(data, total, page, limit));
}
