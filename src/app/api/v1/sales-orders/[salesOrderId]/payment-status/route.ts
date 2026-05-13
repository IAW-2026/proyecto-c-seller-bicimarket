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

  const { payment_status, settlement_id, occurred_at } = body as Record<string, unknown>;

  if (!payment_status) return Errors.badRequest("payment_status is required");

  const validStatuses = ["paid", "refunded", "settled"];
  if (!validStatuses.includes(String(payment_status))) {
    return Errors.badRequest(`payment_status must be one of: ${validStatuses.join(", ")}`);
  }

  const order = await prisma.salesOrder.findUnique({
    where: { id: salesOrderId },
    include: { items: true },
  });
  if (!order) return Errors.notFound("Sales order");

  const historyPayload: Record<string, string> = {};
  if (settlement_id != null) historyPayload.settlement_id = String(settlement_id);
  if (occurred_at != null) historyPayload.occurred_at = String(occurred_at);

  await prisma.salesOrder.update({
    where: { id: salesOrderId },
    data: {
      paymentStatus: payment_status as never,
      statusHistory: {
        create: {
          fromStatus: order.paymentStatus,
          toStatus: String(payment_status),
          source: "payments",
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
