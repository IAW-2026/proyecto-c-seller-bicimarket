import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    salesOrder: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    sellerProfile: {
      findUnique: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
  },
}));

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { GET, POST } from "./route";

const mockAuth = vi.mocked(auth);
const mockSalesOrder = vi.mocked(prisma.salesOrder);
const mockProfile = vi.mocked(prisma.sellerProfile);
const mockProduct = vi.mocked(prisma.product);

const SELLER_PROFILE = {
  id: "slp_1",
  clerkUserId: "clerk_user_1",
  verificationStatus: "verified",
  displayName: "Test Store",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const ORDER_ITEM = {
  id: "item_1",
  salesOrderId: "sor_1",
  productId: "prd_1",
  productNameSnapshot: "Trek Marlin 5",
  unitPriceCents: 15000000,
  quantity: 1,
};

const SALES_ORDER = {
  id: "sor_1",
  orderId: "ord_abc",
  orderSellerGroupId: "osg_abc",
  sellerProfileId: "slp_1",
  buyerProfileId: "byr_1",
  buyerClerkUserId: "clerk_buyer_1",
  paymentId: "pay_1",
  paymentStatus: "paid",
  fulfillmentStatus: "pending",
  shippingStatus: "pending",
  shipmentId: null,
  shippingQuoteId: null,
  itemsSubtotalCents: 15000000,
  shippingCostCents: 50000,
  totalCents: 15050000,
  currency: "ARS",
  shippingAddressSnapshot: { street: "Av. Libertador", number: "100", city: "CABA", province: "CABA" },
  createdAt: new Date(),
  updatedAt: new Date(),
  items: [ORDER_ITEM],
};

// ── GET /sales-orders ────────────────────────────────────────

describe("GET /api/v1/sales-orders", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ userId: "clerk_user_1" } as never);
    mockProfile.findUnique.mockResolvedValue(SELLER_PROFILE as never);
    mockSalesOrder.findMany.mockResolvedValue([SALES_ORDER] as never);
    mockSalesOrder.count.mockResolvedValue(1);
  });

  function makeRequest(params?: Record<string, string>) {
    const url = new URL("http://localhost/api/v1/sales-orders");
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return new NextRequest(url.toString());
  }

  it("returns paginated list of orders for authenticated seller", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);

    const body = await res.json() as { data: unknown[]; pagination: { total: number } };
    expect(body.data).toHaveLength(1);
    expect(body.pagination.total).toBe(1);
  });

  it("serialises order fields to snake_case with items", async () => {
    const res = await GET(makeRequest());
    const body = await res.json() as { data: Record<string, unknown>[] };
    const order = body.data[0];

    expect(order.id).toBe("sor_1");
    expect(order.order_id).toBe("ord_abc");
    expect(order.fulfillment_status).toBe("pending");
    expect(order.payment_status).toBe("paid");
    expect(Array.isArray(order.items)).toBe(true);
  });

  it("filters by fulfillment_status when provided", async () => {
    await GET(makeRequest({ status: "accepted" }));

    const [callArgs] = mockSalesOrder.findMany.mock.calls.at(-1)!;
    expect((callArgs.where as Record<string, unknown>).fulfillmentStatus).toBe("accepted");
  });

  it("always filters to authenticated seller's orders", async () => {
    await GET(makeRequest());

    const [callArgs] = mockSalesOrder.findMany.mock.calls.at(-1)!;
    expect((callArgs.where as Record<string, unknown>).sellerProfileId).toBe("slp_1");
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null } as never);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });
});

// ── POST /sales-orders (server-to-server from Payments) ──────

describe("POST /api/v1/sales-orders", () => {
  beforeEach(() => {
    process.env.INCOMING_SERVICE_TOKEN = "payments-secret";
    mockProduct.findUnique.mockResolvedValue({ sellerProfileId: "slp_1" } as never);
    mockSalesOrder.create.mockResolvedValue(SALES_ORDER as never);
  });

  const VALID_BODY = {
    order_id: "ord_abc",
    order_seller_group_id: "osg_abc",
    buyer_profile_id: "byr_1",
    buyer_clerk_user_id: "clerk_buyer_1",
    payment_id: "pay_1",
    items_subtotal_cents: 15000000,
    shipping_cost_cents: 50000,
    total_cents: 15050000,
    currency: "ARS",
    shipping_address_snapshot: { street: "Av. Libertador", number: "100", city: "CABA", province: "CABA" },
    items: [{ product_id: "prd_1", product_name_snapshot: "Trek Marlin 5", unit_price_cents: 15000000, quantity: 1 }],
  };

  function postRequest(body: unknown, token?: string) {
    return new NextRequest("http://localhost/api/v1/sales-orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Service-Token": token ?? "payments-secret",
      },
      body: JSON.stringify(body),
    });
  }

  it("creates order and returns 201", async () => {
    const res = await POST(postRequest(VALID_BODY));
    expect(res.status).toBe(201);
  });

  it("returns 401 when service token is missing", async () => {
    const req = new NextRequest("http://localhost/api/v1/sales-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(VALID_BODY),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 when service token is wrong", async () => {
    const res = await POST(postRequest(VALID_BODY, "wrong-token"));
    expect(res.status).toBe(401);
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await POST(postRequest({ order_id: "x" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when items array is empty", async () => {
    const res = await POST(postRequest({ ...VALID_BODY, items: [] }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when product in items does not exist", async () => {
    mockProduct.findUnique.mockResolvedValue(null);
    const res = await POST(postRequest(VALID_BODY));
    expect(res.status).toBe(404);
  });

  it("creates nested items in the same transaction", async () => {
    await POST(postRequest(VALID_BODY));

    const [callArgs] = mockSalesOrder.create.mock.calls.at(-1)!;
    expect(callArgs.data.items.create).toHaveLength(1);
    expect(callArgs.data.items.create[0].productId).toBe("prd_1");
    expect(callArgs.data.items.create[0].unitPriceCents).toBe(15000000);
  });

  it("sets payment_status=paid on creation", async () => {
    await POST(postRequest(VALID_BODY));

    const [callArgs] = mockSalesOrder.create.mock.calls.at(-1)!;
    expect(callArgs.data.paymentStatus).toBe("paid");
  });
});
