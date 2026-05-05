import { prisma } from "@/lib/prisma";
import { Errors, requireSellerProfile } from "@/lib/api-utils";
import { formatSalesOrder } from "../route";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ salesOrderId: string }> }
) {
  const { profile, error } = await requireSellerProfile();
  if (error) return error;

  const { salesOrderId } = await params;

  const order = await prisma.salesOrder.findFirst({
    where: { id: salesOrderId, sellerProfileId: profile!.id },
    include: { items: true },
  });
  if (!order) return Errors.notFound("Sales order");

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    // body is optional
  }

  const newStatus = (body.fulfillment_status as string) ?? "ready_to_ship";

  const validTransitions: Record<string, string[]> = {
    accepted: ["preparing"],
    preparing: ["ready_to_ship"],
  };

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

  // When ready_to_ship: in a full implementation, call Shipping App POST /api/v1/shipments
  // Omitted here to keep the implementation self-contained.

  return Response.json(formatSalesOrder(updated));
}
