import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  Errors,
  getPaginationParams,
  paginatedResponse,
  requireSellerProfile,
  requireServiceToken,
} from "@/lib/api-utils";
import { formatSalesOrder } from "./[salesOrderId]/route";

export async function GET(request: NextRequest) {
  const { profile, error } = await requireSellerProfile();
  if (error) return error;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const { page, limit, skip } = getPaginationParams(request);

  const where = {
    sellerProfileId: profile!.id,
    ...(status && { fulfillmentStatus: status as never }),
  };

  const [orders, total] = await Promise.all([
    prisma.salesOrder.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.salesOrder.count({ where }),
  ]);

  return Response.json(paginatedResponse(orders.map(formatSalesOrder), total, page, limit));
}

export async function POST(request: NextRequest) {
  // Called by Payments App server-to-server after payment approval
  const tokenError = requireServiceToken(request);
  if (tokenError) return tokenError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Errors.badRequest("Invalid JSON body");
  }

  const {
    order_id,
    order_seller_group_id,
    buyer_profile_id,
    buyer_clerk_user_id,
    items,
    items_subtotal_cents,
    shipping_cost_cents,
    total_cents,
    currency = "ARS",
    shipping_address_snapshot,
    payment_id,
  } = body as Record<string, unknown>;

  if (!order_id || !order_seller_group_id || !buyer_profile_id || !buyer_clerk_user_id ||
      !items || !items_subtotal_cents || !shipping_cost_cents || !total_cents ||
      !shipping_address_snapshot || !payment_id) {
    return Errors.badRequest("Missing required fields");
  }

  // Resolve seller profile from the first item's product
  const itemsArr = items as Array<{ product_id: string; product_name_snapshot: string; unit_price_cents: number; quantity: number }>;
  if (!itemsArr.length) return Errors.badRequest("items must not be empty");

  const firstProduct = await prisma.product.findUnique({
    where: { id: itemsArr[0].product_id },
    select: { sellerProfileId: true },
  });
  if (!firstProduct) return Errors.notFound("Product");

  const salesOrder = await prisma.salesOrder.create({
    data: {
      orderId: String(order_id),
      orderSellerGroupId: String(order_seller_group_id),
      sellerProfileId: firstProduct.sellerProfileId,
      buyerProfileId: String(buyer_profile_id),
      buyerClerkUserId: String(buyer_clerk_user_id),
      paymentId: String(payment_id),
      paymentStatus: "paid",
      itemsSubtotalCents: Number(items_subtotal_cents),
      shippingCostCents: Number(shipping_cost_cents),
      totalCents: Number(total_cents),
      currency: String(currency),
      shippingAddressSnapshot: shipping_address_snapshot as never,
      items: {
        create: itemsArr.map((item) => ({
          productId: item.product_id,
          productNameSnapshot: item.product_name_snapshot,
          unitPriceCents: item.unit_price_cents,
          quantity: item.quantity,
        })),
      },
    },
    include: { items: true },
  });

  return Response.json(formatSalesOrder(salesOrder), { status: 201 });
}
