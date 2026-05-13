import { prisma } from "@/lib/prisma";
import { Errors, requireServiceToken } from "@/lib/api-utils";
import { formatSalesOrder } from "../../_format";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ salesOrderId: string }> }
) {
  const tokenError = requireServiceToken(request);
  if (tokenError) return tokenError;

  const { salesOrderId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Errors.badRequest("Invalid JSON body");
  }

  const { shipping_status, shipment_id, occurred_at } = body as Record<string, unknown>;

  if (!shipping_status) return Errors.badRequest("shipping_status is required");

  const validStatuses = [
    "ready_for_pickup",
    "picked_up",
    "in_transit",
    "out_for_delivery",
    "delivered",
    "returned",
  ];
  if (!validStatuses.includes(String(shipping_status))) {
    return Errors.badRequest(`shipping_status must be one of: ${validStatuses.join(", ")}`);
  }

  const order = await prisma.salesOrder.findUnique({
    where: { id: salesOrderId },
    include: { items: true },
  });
  if (!order) return Errors.notFound("Sales order");

  const historyPayload: Record<string, string> = {};
  if (shipment_id != null) historyPayload.shipment_id = String(shipment_id);
  if (occurred_at != null) historyPayload.occurred_at = String(occurred_at);

  await prisma.salesOrder.update({
    where: { id: salesOrderId },
    data: {
      shippingStatus: shipping_status as never,
      ...(shipment_id != null ? { shipmentId: String(shipment_id) } : {}),
      statusHistory: {
        create: {
          fromStatus: order.shippingStatus,
          toStatus: String(shipping_status),
          source: "shipping",
          payload: historyPayload,
          occurredAt: occurred_at ? new Date(String(occurred_at)) : new Date(),
        },
      },
    },
  });

  const updated = await prisma.salesOrder.findUnique({
    where: { id: salesOrderId },
    include: { items: true },
  });

  return Response.json(formatSalesOrder(updated!));
}
