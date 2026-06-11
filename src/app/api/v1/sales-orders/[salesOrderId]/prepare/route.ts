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

type Package = {
  weight_grams: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  description: string;
};

async function notifyShipping(salesOrderId: string, order: OrderWithItems, sellerProfileId: string) {
  const shippingUrl = process.env.SHIPPING_API_URL;
  const token = process.env.SHIPPING_SERVICE_TOKEN;

  if (!shippingUrl || !token) {
    console.error("[inter-app] SHIPPING_API_URL or SHIPPING_SERVICE_TOKEN not set — skipping shipment creation");
    return;
  }

  const baseUrl = shippingUrl.replace(/\/$/, "");

  const packages: Package[] = order.items.map((item) => ({
    weight_grams: item.product.weightGrams * item.quantity,
    length_cm: item.product.lengthCm ?? 50,
    width_cm: item.product.widthCm ?? 50,
    height_cm: item.product.heightCm ?? 50,
    description: item.productNameSnapshot,
  }));

  const shipmentBody: Record<string, unknown> = {
    order_id: order.orderId,
    order_seller_group_id: order.orderSellerGroupId,
    sales_order_id: salesOrderId,
    seller_profile_id: sellerProfileId,
    buyer_profile_id: order.buyerProfileId,
    shipping_address_snapshot: order.shippingAddressSnapshot,
    packages,
  };

  if (order.shippingQuoteId) {
    shipmentBody.shipping_quote_id = order.shippingQuoteId;
  } else {
    shipmentBody.service_level = "standard";
  }

  const result = await interAppCall(
    "POST",
    `${baseUrl}/api/v1/shipments`,
    token,
    shipmentBody,
    { "Idempotency-Key": `shipment-${salesOrderId}` }
  );

  if (!result.ok) {
    console.error(`[inter-app] Failed to create shipment for sales_order ${salesOrderId}`, result.data);
    return;
  }

  const shipment = result.data as Record<string, unknown>;
  if (shipment?.id) {
    await prisma.salesOrder.update({
      where: { id: salesOrderId },
      data: { shipmentId: String(shipment.id) },
    });
  }
}
