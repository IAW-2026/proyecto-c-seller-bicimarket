import { prisma } from "@/lib/prisma";
import { Errors, requireSellerProfile } from "@/lib/api-utils";
import { interAppCall } from "@/lib/inter-app";
import { formatSalesOrder } from "../../_format";

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

  // Notify Buyer App: order_seller_group transitions pending → preparing (doc §B5)
  await notifyBuyerAccepted(order.orderId, order.orderSellerGroupId);

  return Response.json(formatSalesOrder(updated));
}

async function notifyBuyerAccepted(orderId: string, sellerGroupId: string) {
  const buyerUrl = process.env.BUYER_API_URL;
  const token = process.env.SELLER_TO_BUYER_SERVICE_TOKEN;

  if (!buyerUrl || !token) {
    console.error("[inter-app] BUYER_API_URL or SELLER_TO_BUYER_SERVICE_TOKEN not set — skipping accept notification");
    return;
  }

  const url = `${buyerUrl.replace(/\/$/, "")}/api/v1/orders/${orderId}/seller-groups/${sellerGroupId}/status`;
  const result = await interAppCall("PATCH", url, token, { status: "preparing" });

  if (!result.ok) {
    console.error(
      `[inter-app] Failed to notify Buyer App of accepted order ${orderId} / group ${sellerGroupId}`,
      result.data
    );
  }
}
