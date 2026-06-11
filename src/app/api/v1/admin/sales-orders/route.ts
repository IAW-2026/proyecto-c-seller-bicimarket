import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getPaginationParams, paginatedResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const url = new URL(request.url);
  const fulfillmentStatus = url.searchParams.get("fulfillment_status");
  const paymentStatus = url.searchParams.get("payment_status");
  const { page, limit, skip } = getPaginationParams(request);

  const where = {
    ...(fulfillmentStatus && { fulfillmentStatus: fulfillmentStatus as never }),
    ...(paymentStatus && { paymentStatus: paymentStatus as never }),
  };

  const [orders, total] = await Promise.all([
    prisma.salesOrder.findMany({
      where,
      include: {
        sellerProfile: { select: { displayName: true } },
        items: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.salesOrder.count({ where }),
  ]);

  const data = orders.map((o) => ({
    id: o.id,
    order_id: o.orderId,
    seller_profile_id: o.sellerProfileId,
    seller_display_name: o.sellerProfile.displayName,
    buyer_profile_id: o.buyerProfileId,
    fulfillment_status: o.fulfillmentStatus,
    payment_status: o.paymentStatus,
    shipping_status: o.shippingStatus,
    items_count: o.items.length,
    total_cents: o.totalCents,
    currency: o.currency,
    created_at: o.createdAt,
  }));

  return Response.json(paginatedResponse(data, total, page, limit));
}
