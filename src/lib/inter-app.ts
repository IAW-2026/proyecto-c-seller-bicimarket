import { randomUUID } from "crypto";

// Per docs §2 rule 7: 3 retries, linear backoff 1s/3s/9s, 5s timeout.
// Only retry on 5xx or network errors. 4xx = caller bug, don't retry.

const RETRY_DELAYS_MS = [1000, 3000, 9000];
const TIMEOUT_MS = 5000;

export type InterAppResponse = {
  ok: boolean;
  status: number;
  data: unknown;
};

export async function interAppCall(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  serviceToken: string,
  body?: unknown
): Promise<InterAppResponse> {
  const requestId = randomUUID();
  const headers: Record<string, string> = {
    "X-Service-Token": serviceToken,
    "X-Request-Id": requestId,
    "User-Agent": "bicimarket-seller/1.0",
    ...(body != null ? { "Content-Type": "application/json" } : {}),
  };

  let lastError: unknown;

  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length + 1; attempt++) {
    if (attempt > 0) {
      await sleep(RETRY_DELAYS_MS[attempt - 1]);
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      let response: Response;
      try {
        response = await fetch(url, {
          method,
          headers,
          body: body != null ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      let data: unknown = null;
      const ct = response.headers.get("content-type") ?? "";
      if (ct.includes("application/json")) {
        try {
          data = await response.json();
        } catch {
          data = null;
        }
      }

      // 4xx = don't retry, it's a contract violation on our side
      if (response.ok || response.status < 500) {
        return { ok: response.ok, status: response.status, data };
      }

      lastError = data;
      console.error(
        `[inter-app] ${method} ${url} attempt ${attempt + 1}/${RETRY_DELAYS_MS.length + 1} — HTTP ${response.status}`,
        data
      );
    } catch (err) {
      lastError = err;
      const reason = err instanceof Error ? err.message : String(err);
      console.error(
        `[inter-app] ${method} ${url} attempt ${attempt + 1}/${RETRY_DELAYS_MS.length + 1} — ${reason}`
      );
    }
  }

  console.error(
    `[inter-app] ${method} ${url} — all ${RETRY_DELAYS_MS.length + 1} attempts failed`,
    lastError
  );
  return { ok: false, status: 502, data: lastError };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
