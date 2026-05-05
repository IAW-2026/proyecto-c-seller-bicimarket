import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { interAppCall } from "./inter-app";

function mockFetch(responses: Array<{ ok: boolean; status: number; body?: unknown }>) {
  let call = 0;
  return vi.spyOn(global, "fetch").mockImplementation(async () => {
    const r = responses[Math.min(call++, responses.length - 1)];
    return {
      ok: r.ok,
      status: r.status,
      headers: { get: () => (r.body != null ? "application/json" : null) },
      json: async () => r.body ?? null,
    } as unknown as Response;
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("interAppCall", () => {
  it("returns ok=true on successful first attempt", async () => {
    mockFetch([{ ok: true, status: 200, body: { id: "abc" } }]);

    const promise = interAppCall("GET", "http://other-app/api", "token");
    await vi.runAllTimersAsync();
    const res = await promise;

    expect(res.ok).toBe(true);
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ id: "abc" });
  });

  it("sends X-Service-Token and X-Request-Id headers", async () => {
    let capturedHeaders: Record<string, string> = {};
    vi.spyOn(global, "fetch").mockImplementation(async (_url, init) => {
      capturedHeaders = init?.headers as Record<string, string>;
      return { ok: true, status: 200, headers: { get: () => null }, json: async () => null } as unknown as Response;
    });

    const promise = interAppCall("POST", "http://other-app/api", "my-token", { foo: "bar" });
    await vi.runAllTimersAsync();
    await promise;

    expect(capturedHeaders["X-Service-Token"]).toBe("my-token");
    expect(capturedHeaders["X-Request-Id"]).toBeTruthy();
    expect(capturedHeaders["Content-Type"]).toBe("application/json");
  });

  it("does NOT retry on 4xx", async () => {
    const spy = mockFetch([{ ok: false, status: 422, body: { error: "bad" } }]);

    const promise = interAppCall("POST", "http://other-app/api", "token", {});
    await vi.runAllTimersAsync();
    const res = await promise;

    expect(spy).toHaveBeenCalledTimes(1);
    expect(res.ok).toBe(false);
    expect(res.status).toBe(422);
  });

  it("retries on 5xx and succeeds on second attempt", async () => {
    const spy = mockFetch([
      { ok: false, status: 503 },
      { ok: true, status: 200, body: { created: true } },
    ]);

    const promise = interAppCall("POST", "http://other-app/api", "token", {});
    await vi.runAllTimersAsync();
    const res = await promise;

    expect(spy).toHaveBeenCalledTimes(2);
    expect(res.ok).toBe(true);
  });

  it("returns 502 after all 4 attempts fail", async () => {
    const spy = mockFetch([{ ok: false, status: 500 }]);

    const promise = interAppCall("POST", "http://other-app/api", "token");
    await vi.runAllTimersAsync();
    const res = await promise;

    expect(spy).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    expect(res.status).toBe(502);
    expect(res.ok).toBe(false);
  });

  it("retries on network error and succeeds on third attempt", async () => {
    let call = 0;
    vi.spyOn(global, "fetch").mockImplementation(async () => {
      call++;
      if (call < 3) throw new Error("ECONNREFUSED");
      return { ok: true, status: 201, headers: { get: () => null }, json: async () => null } as unknown as Response;
    });

    const promise = interAppCall("POST", "http://other-app/api", "token");
    await vi.runAllTimersAsync();
    const res = await promise;

    expect(call).toBe(3);
    expect(res.ok).toBe(true);
  });

  it("sends body as JSON string", async () => {
    let capturedBody: string | undefined;
    vi.spyOn(global, "fetch").mockImplementation(async (_url, init) => {
      capturedBody = init?.body as string;
      return { ok: true, status: 200, headers: { get: () => null }, json: async () => null } as unknown as Response;
    });

    const promise = interAppCall("POST", "http://other-app/api", "token", { amount: 500 });
    await vi.runAllTimersAsync();
    await promise;

    expect(JSON.parse(capturedBody!)).toEqual({ amount: 500 });
  });
});
