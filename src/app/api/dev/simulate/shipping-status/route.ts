import { NextRequest } from "next/server";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "Dev only" }, { status: 403 });
  }

  const token = process.env.INCOMING_SERVICE_TOKEN;
  if (!token) {
    return Response.json({ error: "INCOMING_SERVICE_TOKEN not configured" }, { status: 500 });
  }

  let body: { sales_order_id: string; shipping_status: string; shipment_id?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.sales_order_id || !body.shipping_status) {
    return Response.json({ error: "sales_order_id and shipping_status required" }, { status: 400 });
  }

  const baseUrl = `http://localhost:${process.env.PORT ?? 3000}`;
  const res = await fetch(
    `${baseUrl}/api/v1/sales-orders/${body.sales_order_id}/shipping-status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Service-Token": token,
        "X-Request-Id": randomUUID(),
      },
      body: JSON.stringify({
        shipping_status: body.shipping_status,
        ...(body.shipment_id ? { shipment_id: body.shipment_id } : {}),
        occurred_at: new Date().toISOString(),
      }),
    }
  );

  const data = await res.json();
  return Response.json(data, { status: res.status });
}
