import { prisma } from "@/lib/prisma";
import { Errors, requireSellerProfile } from "@/lib/api-utils";
import { interAppCall } from "@/lib/inter-app";
import { formatSalesOrder } from "../../_format";

const validTransitions: Record<string, string[]> = {
  accepted: ["preparing"],
  preparing: ["ready_to_ship"],
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ salesOrderId: string }> }
) {
  const { profile, error } = await requireSellerProfile();
  if (error) return error;

  const { salesOrderId } = await params;

  const order = await prisma.salesOrder.findFirst({
    where: { id: salesOrderId, sellerProfileId: profile!.id },
    include: {
      items: {
        include: {
          product: {
            select: { weightGrams: true, lengthCm: true, widthCm: true, heightCm: true },
          },
        },
      },
    },
  });
  if (!order) return Errors.notFound("Sales order");

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    // body is optional
  }

  const newStatus = (body.fulfillment_status as string) ?? "ready_to_ship";
  const allowed = validTransitions[order.fulfillmentStatus] ?? [];

  if (!allowed.includes(newStatus)) {
    return Errors.conflict(
      "INVALID_STATUS_TRANSITION",
      `Cannot transition from '${order.fulfillmentStatus}' to '${newStatus}'`
    );
  }

  if (newStatus === "ready_to_ship" && !order.shippingQuoteId) {
    return Errors.unprocessable(
      "MISSING_SHIPPING_QUOTE",
      "Cannot mark order as ready to ship: no shipping quote ID associated with this order"
    );
  }

  const updated = await prisma.salesOrder.update({
    where: { id: salesOrderId },
    data: {
      fulfillmentStatus: newStatus as never,
      statusHistory: {
        create: {
          fromStatus: order.fulfillmentStatus,
          toStatus: newStatus,
          source: "seller",
          occurredAt: new Date(),
        },
      },
    },
    include: { items: true },
  });

  // When the order is ready to ship, notify Shipping App to create the shipment.
  if (newStatus === "ready_to_ship") {
    await notifyShipping(salesOrderId, order, profile!.id);
  }

  return Response.json(formatSalesOrder(updated));
}

type OrderWithItems = {
  id: string;
  orderId: string;
  orderSellerGroupId: string;
  sellerProfileId: string;
  buyerProfileId: string;
  shippingAddressSnapshot: unknown;
  shippingQuoteId: string | null;
  items: Array<{
    productNameSnapshot: string;
    quantity: number;
    product: {
      weightGrams: number;
      lengthCm: number | null;
      widthCm: number | null;
      heightCm: number | null;
    };
  }>;
};

async function notifyShipping(salesOrderId: string, order: OrderWithItems, sellerProfileId: string) {
  const shippingUrl = process.env.SHIPPING_API_URL;
  const token = process.env.SHIPPING_SERVICE_TOKEN;

  if (!shippingUrl || !token) {
    console.error("[inter-app] SHIPPING_API_URL or SHIPPING_SERVICE_TOKEN not set — skipping shipment creation");
    return;
  }

  // Build one package per line item. Weight is per-unit × quantity.
  const packages = order.items.map((item) => ({
    weight_grams: item.product.weightGrams * item.quantity,
    length_cm: item.product.lengthCm ?? 50,
    width_cm: item.product.widthCm ?? 50,
    height_cm: item.product.heightCm ?? 50,
    description: item.productNameSnapshot,
  }));

  const body = {
    shipping_quote_id: order.shippingQuoteId,
    order_id: order.orderId,
    order_seller_group_id: order.orderSellerGroupId,
    sales_order_id: salesOrderId,
    seller_profile_id: sellerProfileId,
    buyer_profile_id: order.buyerProfileId,
    shipping_address_snapshot: order.shippingAddressSnapshot,
    packages,
  };

  const url = `${shippingUrl.replace(/\/$/, "")}/api/v1/shipments`;
  const result = await interAppCall("POST", url, token, body, {
    "Idempotency-Key": `shipment-${salesOrderId}`,
  });

  if (!result.ok) {
    // Per docs §2 rule 7: log and report — do NOT block the seller's status change.
    console.error(
      `[inter-app] Failed to create shipment for sales_order ${salesOrderId}`,
      result.data
    );
    return;
  }

  // Store the returned shipment_id on the sales order so Shipping's PATCH
  // /shipping-status can be correlated later.
  const shipment = result.data as Record<string, unknown>;
  if (shipment?.id) {
    await prisma.salesOrder.update({
      where: { id: salesOrderId },
      data: { shipmentId: String(shipment.id) },
    });
  }
}
