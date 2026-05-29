import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  Errors,
  getPaginationParams,
  paginatedResponse,
  requireSellerProfile,
  requireServiceToken,
} from "@/lib/api-utils";
import { formatSalesOrder } from "./_format";

// ── Stub data (shown when the seller has no orders yet) ──────

type StubProduct = { id: string; title: string; priceCents: number };

function buildStub(sellerId: string, products: StubProduct[]) {
  const addr = {
    street: "Av. Corrientes",
    number: "1234",
    city: "Buenos Aires",
    province: "CABA",
    postal_code: "C1043",
    country: "AR",
  };

  const now = Date.now();
  const ago = (days: number) => new Date(now - days * 86_400_000).toISOString();

  const prod = (i: number): StubProduct =>
    products[i % products.length] ?? {
      id: `prod_stub_${i}`,
      title: `Producto de ejemplo ${i + 1}`,
      priceCents: (i + 1) * 15000,
    };

  const item = (p: StubProduct, qty = 1) => ({
    id: `item_stub_${p.id.slice(-6)}_${qty}`,
    product_id: p.id,
    product_name_snapshot: p.title,
    unit_price_cents: p.priceCents,
    quantity: qty,
  });

  const order = (
    idx: number,
    fulfillment_status: string,
    items: ReturnType<typeof item>[],
    daysOld: number,
    extra: Record<string, unknown> = {}
  ) => {
    const subtotal = items.reduce((s, i) => s + i.unit_price_cents * i.quantity, 0);
    const shipping = 5000;
    return {
      id: `ord_stub_${String(idx).padStart(4, "0")}`,
      order_id: `ext_stub_${String(idx).padStart(4, "0")}`,
      order_seller_group_id: `grp_stub_${String(idx).padStart(4, "0")}`,
      seller_profile_id: sellerId,
      buyer_profile_id: `buyer_stub_${String(idx).padStart(4, "0")}`,
      fulfillment_status,
      shipping_status: "pending",
      payment_status: "paid",
      shipment_id: null,
      items_subtotal_cents: subtotal,
      shipping_cost_cents: shipping,
      total_cents: subtotal + shipping,
      currency: "ARS",
      shipping_address_snapshot: addr,
      items,
      created_at: ago(daysOld),
      updated_at: ago(daysOld),
      ...extra,
    };
  };

  return [
    order(1, "pending",       [item(prod(0))],             0),
    order(2, "accepted",      [item(prod(1), 2)],          1),
    order(3, "preparing",     [item(prod(2))],             3),
    order(4, "ready_to_ship", [item(prod(3))],             5),
    order(5, "handed_over",   [item(prod(0))],             8),
    order(6, "delivered",     [item(prod(1)), item(prod(2))], 14),
    order(7, "rejected",      [item(prod(3))], 10, { payment_status: "refunded" }),
    order(8, "cancelled",     [item(prod(0))], 12, { payment_status: "refunded" }),
  ];
}

function stubResponse(
  request: NextRequest,
  sellerId: string,
  products: StubProduct[]
) {
  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status");
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50", 10)));

  let items = buildStub(sellerId, products);
  if (statusFilter) items = items.filter((o) => o.fulfillment_status === statusFilter);

  const total = items.length;
  const paged = items.slice((page - 1) * limit, page * limit);

  return Response.json({
    data: paged,
    pagination: { total, page, limit, has_more: page * limit < total },
  });
}

// ── Handlers ─────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { profile, error } = await requireSellerProfile();
  if (error) return error;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const { page, limit, skip } = getPaginationParams(request);

  // Fall back to stub when the seller has no real orders yet
  const totalForSeller = await prisma.salesOrder.count({
    where: { sellerProfileId: profile!.id },
  });

  if (totalForSeller === 0) {
    const products = await prisma.product.findMany({
      where: { sellerProfileId: profile!.id, deletedAt: null },
      select: { id: true, title: true, priceCents: true },
      take: 5,
    });
    return stubResponse(request, profile!.id, products);
  }

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
    shipping_quote_id,
  } = body as Record<string, unknown>;

  if (!order_id || !order_seller_group_id || !buyer_profile_id || !buyer_clerk_user_id ||
      !items || !items_subtotal_cents || !shipping_cost_cents || !total_cents ||
      !shipping_address_snapshot || !payment_id) {
    return Errors.badRequest("Missing required fields");
  }

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
      ...(shipping_quote_id != null ? { shippingQuoteId: String(shipping_quote_id) } : {}),
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
