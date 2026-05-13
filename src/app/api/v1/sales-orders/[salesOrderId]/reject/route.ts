import { prisma } from "@/lib/prisma";
import { Errors, requireSellerProfile } from "@/lib/api-utils";
import { interAppCall } from "@/lib/inter-app";
import { formatSalesOrder } from "../../_format";

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
    return Errors.conflict(
      "INVALID_STATUS_TRANSITION",
      `Cannot reject order in status '${order.fulfillmentStatus}'`
    );
  }

  let reason = "";
  try {
    const body = (await request.json()) as { reason?: string };
    reason = body.reason ?? "";
  } catch {
    // reason is optional
  }

  const historyPayload: Record<string, string> = {};
  if (reason) historyPayload.reason = reason;

  const updated = await prisma.salesOrder.update({
    where: { id: salesOrderId },
    data: {
      fulfillmentStatus: "rejected",
      statusHistory: {
        create: {
          fromStatus: order.fulfillmentStatus,
          toStatus: "rejected",
          source: "seller",
          payload: historyPayload,
          occurredAt: new Date(),
        },
      },
    },
    include: { items: true },
  });

  // Notify Payments App to refund the buyer.
  await requestRefund(order.paymentId, order.totalCents, order.sellerProfileId);

  return Response.json(formatSalesOrder(updated));
}

async function requestRefund(
  paymentId: string,
  totalCents: number,
  sellerProfileId: string
) {
  const paymentsUrl = process.env.PAYMENTS_API_URL;
  const token = process.env.PAYMENTS_SERVICE_TOKEN;

  if (!paymentsUrl || !token) {
    console.error("[inter-app] PAYMENTS_API_URL or PAYMENTS_SERVICE_TOKEN not set — skipping refund call");
    return;
  }

  const url = `${paymentsUrl.replace(/\/$/, "")}/api/v1/payments/${paymentId}/refund`;

  const result = await interAppCall("POST", url, token, {
    amount_cents: totalCents,
    reason: "seller_rejected",
    seller_profile_id: sellerProfileId,
  });

  if (!result.ok) {
    // Log and continue — the rejection is already recorded. The Payments team
    // will see the failed outbound call in their logs and can trigger the refund manually.
    console.error(
      `[inter-app] Failed to request refund for payment ${paymentId}`,
      result.data
    );
  }
}
