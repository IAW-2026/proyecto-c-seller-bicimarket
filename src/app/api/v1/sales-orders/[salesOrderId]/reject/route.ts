import { prisma } from "@/lib/prisma";
import { Errors, requireSellerProfile } from "@/lib/api-utils";
import { formatSalesOrder } from "../route";

export async function POST(
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

  if (!["pending", "accepted"].includes(order.fulfillmentStatus)) {
    return Errors.conflict("INVALID_STATUS_TRANSITION", `Cannot reject order in status '${order.fulfillmentStatus}'`);
  }

  let reason = "";
  try {
    const body = (await request.json()) as { reason?: string };
    reason = body.reason ?? "";
  } catch {
    // reason is optional
  }

  const updated = await prisma.salesOrder.update({
    where: { id: salesOrderId },
    data: {
      fulfillmentStatus: "rejected",
      statusHistory: {
        create: {
          fromStatus: order.fulfillmentStatus,
          toStatus: "rejected",
          source: "seller",
          payload: reason ? { reason } : undefined,
          occurredAt: new Date(),
        },
      },
    },
    include: { items: true },
  });

  // In a full implementation: call Payments App POST /api/v1/payments/{id}/refund
  // Omitted here to keep the implementation self-contained.

  return Response.json(formatSalesOrder(updated));
}
