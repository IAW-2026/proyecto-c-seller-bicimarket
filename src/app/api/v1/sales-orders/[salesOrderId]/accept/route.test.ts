import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    salesOrder: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    sellerProfile: {
      findUnique: vi.fn(),
    },
  },
}));

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { POST } from "./route";

const mockAuth = vi.mocked(auth);
const mockSalesOrder = vi.mocked(prisma.salesOrder);
const mockProfile = vi.mocked(prisma.sellerProfile);

const SELLER_PROFILE = {
  id: "slp_1",
  clerkUserId: "clerk_user_1",
  verificationStatus: "verified",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const PENDING_ORDER = {
  id: "sor_1",
  sellerProfileId: "slp_1",
  fulfillmentStatus: "pending",
  orderId: "ord_abc",
  orderSellerGroupId: "osg_abc",
  buyerProfileId: "byr_1",
  buyerClerkUserId: "clerk_buyer_1",
  paymentId: "pay_1",
  paymentStatus: "paid",
  shippingStatus: "pending",
  shipmentId: null,
  shippingQuoteId: null,
  itemsSubtotalCents: 15000000,
  shippingCostCents: 50000,
  totalCents: 15050000,
  currency: "ARS",
  shippingAddressSnapshot: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  items: [],
};

function makeContext(salesOrderId: string) {
  return { params: Promise.resolve({ salesOrderId }) };
}

function makeRequest() {
  return new Request("http://localhost/api/v1/sales-orders/sor_1/accept", { method: "POST" });
}

describe("POST /api/v1/sales-orders/[salesOrderId]/accept", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ userId: "clerk_user_1" } as never);
    mockProfile.findUnique.mockResolvedValue(SELLER_PROFILE as never);
    mockSalesOrder.findFirst.mockResolvedValue(PENDING_ORDER as never);
    mockSalesOrder.update.mockResolvedValue({ ...PENDING_ORDER, fulfillmentStatus: "accepted" } as never);
  });

  it("transitions order from pending → accepted", async () => {
    const res = await POST(makeRequest(), makeContext("sor_1"));
    expect(res.status).toBe(200);

    const body = await res.json() as Record<string, unknown>;
    expect(body.fulfillment_status).toBe("accepted");
  });

  it("writes status history entry", async () => {
    await POST(makeRequest(), makeContext("sor_1"));

    const [callArgs] = mockSalesOrder.update.mock.calls.at(-1)!;
    const history = (callArgs.data as { statusHistory: { create: { fromStatus: string; toStatus: string; source: string } } }).statusHistory.create;
    expect(history.fromStatus).toBe("pending");
    expect(history.toStatus).toBe("accepted");
    expect(history.source).toBe("seller");
  });

  it("returns 409 when order is not in pending status", async () => {
    mockSalesOrder.findFirst.mockResolvedValue({ ...PENDING_ORDER, fulfillmentStatus: "accepted" } as never);

    const res = await POST(makeRequest(), makeContext("sor_1"));
    expect(res.status).toBe(409);

    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe("INVALID_STATUS_TRANSITION");
  });

  it("returns 409 for rejected order", async () => {
    mockSalesOrder.findFirst.mockResolvedValue({ ...PENDING_ORDER, fulfillmentStatus: "rejected" } as never);
    const res = await POST(makeRequest(), makeContext("sor_1"));
    expect(res.status).toBe(409);
  });

  it("returns 404 when order not found", async () => {
    mockSalesOrder.findFirst.mockResolvedValue(null);
    const res = await POST(makeRequest(), makeContext("sor_1"));
    expect(res.status).toBe(404);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null } as never);
    const res = await POST(makeRequest(), makeContext("sor_1"));
    expect(res.status).toBe(401);
  });
});
