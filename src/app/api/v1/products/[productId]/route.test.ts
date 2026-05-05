import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
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
import { GET, PATCH, DELETE } from "./route";

const mockAuth = vi.mocked(auth);
const mockProduct = vi.mocked(prisma.product);
const mockProfile = vi.mocked(prisma.sellerProfile);

const SELLER_PROFILE = {
  id: "slp_1",
  clerkUserId: "clerk_user_1",
  verificationStatus: "verified",
  displayName: "Test Store",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const PRODUCT = {
  id: "prd_1",
  sellerProfileId: "slp_1",
  title: "Trek Marlin 5",
  description: "MTB bike",
  brand: "Trek",
  model: "Marlin 5",
  category: "mtb",
  condition: "new",
  priceCents: 15000000,
  currency: "ARS",
  weightGrams: 13500,
  lengthCm: null,
  widthCm: null,
  heightCm: null,
  status: "draft",
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  images: [{ id: "img_1", url: "https://example.com/bike.jpg", position: 0 }],
  sellerProfile: { displayName: "Test Store" },
};

function makeContext(productId: string) {
  return { params: Promise.resolve({ productId }) };
}

// ── GET ──────────────────────────────────────────────────────

describe("GET /api/v1/products/[productId]", () => {
  it("returns product with seller_display_name", async () => {
    mockProduct.findFirst.mockResolvedValue(PRODUCT as never);

    const req = new NextRequest("http://localhost/api/v1/products/prd_1");
    const res = await GET(req, makeContext("prd_1"));
    expect(res.status).toBe(200);

    const body = await res.json() as Record<string, unknown>;
    expect(body.id).toBe("prd_1");
    expect(body.seller_display_name).toBe("Test Store");
    expect(body.images).toHaveLength(1);
  });

  it("returns 404 when product not found", async () => {
    mockProduct.findFirst.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/v1/products/missing");
    const res = await GET(req, makeContext("missing"));
    expect(res.status).toBe(404);
  });
});

// ── PATCH ────────────────────────────────────────────────────

describe("PATCH /api/v1/products/[productId]", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ userId: "clerk_user_1" } as never);
    mockProfile.findUnique.mockResolvedValue(SELLER_PROFILE as never);
    mockProduct.findFirst.mockResolvedValue(PRODUCT as never);
    mockProduct.update.mockResolvedValue({ ...PRODUCT, title: "Updated Title", images: PRODUCT.images } as never);
  });

  function patchRequest(body: unknown) {
    return new NextRequest("http://localhost/api/v1/products/prd_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("updates title and returns updated product", async () => {
    const res = await PATCH(patchRequest({ title: "Updated Title" }), makeContext("prd_1"));
    expect(res.status).toBe(200);

    const body = await res.json() as Record<string, unknown>;
    expect(body.title).toBe("Updated Title");
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null } as never);
    const res = await PATCH(patchRequest({ title: "x" }), makeContext("prd_1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when product not found or not owned by seller", async () => {
    mockProduct.findFirst.mockResolvedValue(null);
    const res = await PATCH(patchRequest({ title: "x" }), makeContext("prd_1"));
    expect(res.status).toBe(404);
  });

  it("blocks activation when no images", async () => {
    mockProduct.findFirst.mockResolvedValue({ ...PRODUCT, images: [] } as never);
    const res = await PATCH(patchRequest({ status: "active" }), makeContext("prd_1"));
    expect(res.status).toBe(422);

    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe("VALIDATION_FAILED");
  });

  it("blocks activation when seller not verified", async () => {
    mockProfile.findUnique.mockResolvedValue({ ...SELLER_PROFILE, verificationStatus: "pending_review" } as never);
    const res = await PATCH(patchRequest({ status: "active" }), makeContext("prd_1"));
    expect(res.status).toBe(422);

    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe("SELLER_NOT_VERIFIED");
  });

  it("allows activation when seller is verified and product has image and weight/price", async () => {
    const res = await PATCH(patchRequest({ status: "active" }), makeContext("prd_1"));
    expect(res.status).toBe(200);
  });
});

// ── DELETE ───────────────────────────────────────────────────

describe("DELETE /api/v1/products/[productId]", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ userId: "clerk_user_1" } as never);
    mockProfile.findUnique.mockResolvedValue(SELLER_PROFILE as never);
    mockProduct.findFirst.mockResolvedValue(PRODUCT as never);
    mockProduct.update.mockResolvedValue({ ...PRODUCT, status: "archived" } as never);
  });

  function deleteRequest() {
    return new NextRequest("http://localhost/api/v1/products/prd_1", { method: "DELETE" });
  }

  it("returns 204 No Content on success", async () => {
    const res = await DELETE(deleteRequest(), makeContext("prd_1"));
    expect(res.status).toBe(204);
  });

  it("soft-deletes by setting status=archived and deletedAt", async () => {
    await DELETE(deleteRequest(), makeContext("prd_1"));

    const [callArgs] = mockProduct.update.mock.calls.at(-1)!;
    expect(callArgs.data.status).toBe("archived");
    expect(callArgs.data.deletedAt).toBeInstanceOf(Date);
  });

  it("returns 404 when product not found", async () => {
    mockProduct.findFirst.mockResolvedValue(null);
    const res = await DELETE(deleteRequest(), makeContext("prd_1"));
    expect(res.status).toBe(404);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null } as never);
    const res = await DELETE(deleteRequest(), makeContext("prd_1"));
    expect(res.status).toBe(401);
  });
});
