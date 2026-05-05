import { prisma } from "@/lib/prisma";
import { Errors, requireSellerProfile } from "@/lib/api-utils";
import { formatSalesOrder } from "../route";

export async function POST(
  _request: Request,
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

  if (order.fulfillmentStatus !== "pending") {
    return Errors.conflict("INVALID_STATUS_TRANSITION", `Cannot accept order in status '${order.fulfillmentStatus}'`);
  }

  const updated = await prisma.salesOrder.update({
    where: { id: salesOrderId },
    data: {
      fulfillmentStatus: "accepted",
      statusHistory: {
        create: {
          fromStatus: order.fulfillmentStatus,
          toStatus: "accepted",
          source: "seller",
          occurredAt: new Date(),
        },
      },
    },
    include: { items: true },
  });

  return Response.json(formatSalesOrder(updated));
}
