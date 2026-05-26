import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "Dev only" }, { status: 403 });
  }

  const token = process.env.INCOMING_SERVICE_TOKEN;
  if (!token) {
    return Response.json({ error: "INCOMING_SERVICE_TOKEN not configured" }, { status: 500 });
  }

  let body: { sales_order_id: string; payment_status: string; settlement_id?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.sales_order_id || !body.payment_status) {
    return Response.json({ error: "sales_order_id and payment_status required" }, { status: 400 });
  }

  // When settling, register the settlement in the mock Payments App first,
  // so the settlements tab shows real amounts from this order.
  let settlementId = body.settlement_id ?? `mock_sett_${randomUUID().slice(0, 8)}`;

  if (body.payment_status === "settled") {
    const paymentsUrl = process.env.PAYMENTS_API_URL;
    const paymentsToken = process.env.PAYMENTS_SERVICE_TOKEN;

    if (paymentsUrl && paymentsToken) {
      const order = await prisma.salesOrder.findUnique({
        where: { id: body.sales_order_id },
        select: {
          id: true,
          orderId: true,
          sellerProfileId: true,
          totalCents: true,
          shippingCostCents: true,
          currency: true,
        },
      });

      if (order) {
        // Settlement covers product subtotal only (total - shipping)
        const grossCents = order.totalCents - order.shippingCostCents;
        try {
          const settResp = await fetch(
            `${paymentsUrl.replace(/\/$/, "")}/api/v1/settlements`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Service-Token": paymentsToken,
              },
              body: JSON.stringify({
                order_id: order.orderId,
                seller_profile_id: order.sellerProfileId,
                gross_amount_cents: grossCents,
                currency: order.currency,
              }),
            }
          );
          if (settResp.ok) {
            const sett = await settResp.json();
            settlementId = sett.id ?? settlementId;
          }
        } catch {
          // Non-fatal: proceed without registering the settlement in the mock
        }
      }
    }
  }

  const baseUrl = `http://localhost:${process.env.PORT ?? 3000}`;
  const res = await fetch(
    `${baseUrl}/api/v1/sales-orders/${body.sales_order_id}/payment-status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Service-Token": token,
        "X-Request-Id": randomUUID(),
      },
      body: JSON.stringify({
        payment_status: body.payment_status,
        settlement_id: settlementId,
        occurred_at: new Date().toISOString(),
      }),
    }
  );

  const data = await res.json();
  return Response.json(data, { status: res.status });
}
