import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPaginationParams, paginatedResponse, validateServiceToken, errorResponse } from "./api-utils";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

function makeRequest(url: string) {
  return new Request(url);
}

describe("getPaginationParams", () => {
  it("returns defaults when no params given", () => {
    const { page, limit, skip } = getPaginationParams(makeRequest("http://x/api?"));
    expect(page).toBe(1);
    expect(limit).toBe(20);
    expect(skip).toBe(0);
  });

  it("parses custom page and limit", () => {
    const { page, limit, skip } = getPaginationParams(makeRequest("http://x/api?page=3&limit=10"));
    expect(page).toBe(3);
    expect(limit).toBe(10);
    expect(skip).toBe(20);
  });

  it("caps limit at 100", () => {
    const { limit } = getPaginationParams(makeRequest("http://x/api?limit=999"));
    expect(limit).toBe(100);
  });

  it("clamps page to minimum 1", () => {
    const { page, skip } = getPaginationParams(makeRequest("http://x/api?page=0"));
    expect(page).toBe(1);
    expect(skip).toBe(0);
  });
});

describe("paginatedResponse", () => {
  it("sets has_more=false when all results fit in one page", () => {
    const res = paginatedResponse(["a", "b"], 2, 1, 20);
    expect(res.pagination.has_more).toBe(false);
    expect(res.pagination.total).toBe(2);
    expect(res.data).toHaveLength(2);
  });

  it("sets has_more=true when there are more pages", () => {
    const res = paginatedResponse(Array(20).fill("x"), 45, 1, 20);
    expect(res.pagination.has_more).toBe(true);
  });

  it("has_more=false on last page", () => {
    const res = paginatedResponse(Array(5).fill("x"), 25, 2, 20);
    // page 2 * limit 20 = 40, but total is 25, so page 2 covers items 21-25 → no more
    expect(res.pagination.has_more).toBe(false);
  });

  it("includes page and limit in pagination", () => {
    const res = paginatedResponse([], 0, 2, 10);
    expect(res.pagination.page).toBe(2);
    expect(res.pagination.limit).toBe(10);
  });
});

describe("validateServiceToken", () => {
  beforeEach(() => {
    process.env.INCOMING_SERVICE_TOKEN = "secret-token";
  });

  it("returns true when token matches", () => {
    const req = new Request("http://x", {
      headers: { "X-Service-Token": "secret-token" },
    });
    expect(validateServiceToken(req)).toBe(true);
  });

  it("returns false when token is wrong", () => {
    const req = new Request("http://x", {
      headers: { "X-Service-Token": "wrong" },
    });
    expect(validateServiceToken(req)).toBe(false);
  });

  it("returns false when token is missing", () => {
    const req = new Request("http://x");
    expect(validateServiceToken(req)).toBe(false);
  });

  it("returns false when env var is not set", () => {
    delete process.env.INCOMING_SERVICE_TOKEN;
    const req = new Request("http://x", {
      headers: { "X-Service-Token": "anything" },
    });
    expect(validateServiceToken(req)).toBe(false);
  });
});

describe("errorResponse", () => {
  it("returns correct status code", async () => {
    const res = errorResponse("NOT_FOUND", "not found", 404);
    expect(res.status).toBe(404);
  });

  it("wraps error in { error: { code, message } }", async () => {
    const res = errorResponse("BAD_REQUEST", "bad input", 400);
    const body = await res.json() as { error: { code: string; message: string } };
    expect(body.error.code).toBe("BAD_REQUEST");
    expect(body.error.message).toBe("bad input");
  });

  it("includes details when provided", async () => {
    const res = errorResponse("VALIDATION", "invalid", 422, { field: "required" });
    const body = await res.json() as { error: { details: Record<string, string> } };
    expect(body.error.details.field).toBe("required");
  });

  it("omits details when not provided", async () => {
    const res = errorResponse("ERR", "msg", 500);
    const body = await res.json() as { error: Record<string, unknown> };
    expect(body.error.details).toBeUndefined();
  });
});
