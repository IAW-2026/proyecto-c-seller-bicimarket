import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ────────────────────────────────────────────────────

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    sellerProfile: {
      findUnique: vi.fn(),
    },
  },
}));

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { GET, POST } from "./route";

const mockAuth = vi.mocked(auth);
const mockProduct = vi.mocked(prisma.product);
const mockProfile = vi.mocked(prisma.sellerProfile);

// ── Fixtures ─────────────────────────────────────────────────

const SELLER_PROFILE = {
  id: "slp_1",
  clerkUserId: "clerk_user_1",
  legalName: "Test SRL",
  displayName: "Test Store",
  taxId: "20-12345678-1",
  taxCondition: "monotributo",
  bankAccountReference: "alias.test",
  pickupAddress: {},
  verificationStatus: "verified",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const BASE_PRODUCT = {
  id: "prd_1",
  sellerProfileId: "slp_1",
  title: "Trek Marlin 5",
  description: "Great entry-level MTB",
  brand: "Trek",
  model: "Marlin 5",
  category: "mtb",
  condition: "new",
  priceCents: 150000_00,
  currency: "ARS",
  weightGrams: 13500,
  lengthCm: null,
  widthCm: null,
  heightCm: null,
  status: "active",
  deletedAt: null,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  images: [{ id: "img_1", url: "https://example.com/bike.jpg", position: 0 }],
};

function makeRequest(path: string, params?: Record<string, string>) {
  const url = new URL(`http://localhost/api/v1/products${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString());
}

// ── GET /products ─────────────────────────────────────────────

describe("GET /api/v1/products", () => {
  beforeEach(() => {
    mockProduct.findMany.mockResolvedValue([BASE_PRODUCT] as never);
    mockProduct.count.mockResolvedValue(1);
  });

  it("returns paginated list with correct shape", async () => {
    const res = await GET(makeRequest(""));
    expect(res.status).toBe(200);

    const body = await res.json() as { data: unknown[]; pagination: { total: number; has_more: boolean } };
    expect(body.data).toHaveLength(1);
    expect(body.pagination.total).toBe(1);
    expect(body.pagination.has_more).toBe(false);
  });

  it("serialises product fields to snake_case", async () => {
    const res = await GET(makeRequest(""));
    const body = await res.json() as { data: Record<string, unknown>[] };
    const product = body.data[0];

    expect(product.id).toBe("prd_1");
    expect(product.seller_profile_id).toBe("slp_1");
    expect(product.price_cents).toBe(150000_00);
    expect(product.main_image_url).toBe("https://example.com/bike.jpg");
  });

  it("passes category filter to Prisma where clause", async () => {
    await GET(makeRequest("", { category: "road" }));

    const [callArgs] = mockProduct.findMany.mock.calls.at(-1)!;
    expect((callArgs.where as Record<string, unknown>).category).toBe("road");
  });

  it("passes text search (q) to Prisma where clause", async () => {
    await GET(makeRequest("", { q: "trek" }));

    const [callArgs] = mockProduct.findMany.mock.calls.at(-1)!;
    expect((callArgs.where as Record<string, unknown>).title).toMatchObject({ contains: "trek" });
  });

  it("respects custom pagination params", async () => {
    mockProduct.findMany.mockResolvedValue([]);
    mockProduct.count.mockResolvedValue(50);

    const res = await GET(makeRequest("", { page: "3", limit: "5" }));
    const body = await res.json() as { pagination: { page: number; limit: number } };
    expect(body.pagination.page).toBe(3);
    expect(body.pagination.limit).toBe(5);

    const [callArgs] = mockProduct.findMany.mock.calls.at(-1)!;
    expect(callArgs.skip).toBe(10); // (3-1) * 5
    expect(callArgs.take).toBe(5);
  });

  it("returns empty data when no products exist", async () => {
    mockProduct.findMany.mockResolvedValue([]);
    mockProduct.count.mockResolvedValue(0);

    const res = await GET(makeRequest(""));
    const body = await res.json() as { data: unknown[] };
    expect(body.data).toHaveLength(0);
  });
});

// ── POST /products ────────────────────────────────────────────

describe("POST /api/v1/products", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ userId: "clerk_user_1" } as never);
    mockProfile.findUnique.mockResolvedValue(SELLER_PROFILE as never);
    mockProduct.create.mockResolvedValue({ ...BASE_PRODUCT, status: "draft", images: [] } as never);
  });

  const VALID_BODY = {
    title: "Trek Marlin 5",
    description: "Entry-level MTB",
    brand: "Trek",
    model: "Marlin 5",
    category: "mtb",
    condition: "new",
    price_cents: 15000000,
    weight_grams: 13500,
  };

  function postRequest(body: unknown) {
    return new NextRequest("http://localhost/api/v1/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("creates product and returns 201", async () => {
    const res = await POST(postRequest(VALID_BODY));
    expect(res.status).toBe(201);
  });

  it("returns product with status=draft", async () => {
    const res = await POST(postRequest(VALID_BODY));
    const body = await res.json() as Record<string, unknown>;
    expect(body.status).toBe("draft");
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null } as never);

    const res = await POST(postRequest(VALID_BODY));
    expect(res.status).toBe(401);
  });

  it("returns 404 when seller profile does not exist", async () => {
    mockProfile.findUnique.mockResolvedValue(null);

    const res = await POST(postRequest(VALID_BODY));
    expect(res.status).toBe(404);
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await POST(postRequest({ title: "Only title" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when body is not valid JSON", async () => {
    const req = new NextRequest("http://localhost/api/v1/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("passes correct data to Prisma create", async () => {
    await POST(postRequest(VALID_BODY));

    const [callArgs] = mockProduct.create.mock.calls.at(-1)!;
    expect(callArgs.data.title).toBe("Trek Marlin 5");
    expect(callArgs.data.priceCents).toBe(15000000);
    expect(callArgs.data.weightGrams).toBe(13500);
    expect(callArgs.data.sellerProfileId).toBe("slp_1");
  });

  it("stores optional dimensions_cm when provided", async () => {
    await POST(postRequest({
      ...VALID_BODY,
      dimensions_cm: { length: 180, width: 60, height: 90 },
    }));

    const [callArgs] = mockProduct.create.mock.calls.at(-1)!;
    expect(callArgs.data.lengthCm).toBe(180);
    expect(callArgs.data.widthCm).toBe(60);
    expect(callArgs.data.heightCm).toBe(90);
  });
});
