import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "Dev only" }, { status: 403 });
  }

  const token = process.env.INCOMING_SERVICE_TOKEN;
  if (!token) {
    return Response.json({ error: "INCOMING_SERVICE_TOKEN not configured" }, { status: 500 });
  }

  let body: { items: Array<{ product_id: string; quantity: number }>; shipping_cost_cents?: number };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.items?.length) {
    return Response.json({ error: "items required" }, { status: 400 });
  }

  const products = await prisma.product.findMany({
    where: { id: { in: body.items.map((i) => i.product_id) }, status: "active" },
    select: { id: true, title: true, priceCents: true },
  });

  if (products.length !== body.items.length) {
    return Response.json({ error: "Some products not found or not active" }, { status: 422 });
  }

  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  const items = body.items.map((i) => ({
    product_id: i.product_id,
    product_name_snapshot: productMap[i.product_id].title,
    unit_price_cents: productMap[i.product_id].priceCents,
    quantity: i.quantity,
  }));

  const subtotal = items.reduce((s, i) => s + i.unit_price_cents * i.quantity, 0);
  const shipping = body.shipping_cost_cents ?? 50000;

  const payload = {
    order_id: `mock_order_${randomUUID().slice(0, 8)}`,
    order_seller_group_id: `mock_group_${randomUUID().slice(0, 8)}`,
    buyer_profile_id: "mock_buyer_profile_001",
    buyer_clerk_user_id: "mock_buyer_clerk_001",
    payment_id: `mock_pay_${randomUUID().slice(0, 8)}`,
    items,
    items_subtotal_cents: subtotal,
    shipping_cost_cents: shipping,
    total_cents: subtotal + shipping,
    currency: "ARS",
    shipping_address_snapshot: {
      street: "Av. Corrientes",
      number: "1234",
      floor: "3",
      apartment: "B",
      city: "Buenos Aires",
      province: "CABA",
      zip: "C1043",
      country: "AR",
    },
  };

  const baseUrl = `http://localhost:${process.env.PORT ?? 3000}`;
  const res = await fetch(`${baseUrl}/api/v1/sales-orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Service-Token": token,
      "X-Request-Id": randomUUID(),
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  return Response.json(data, { status: res.status });
}
