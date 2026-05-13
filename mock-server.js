#!/usr/bin/env node
// Local mock server — simulates Shipping App and Payments App during development.
//
// Usage:
//   node mock-server.js
//
// Then in .env.local:
//   SHIPPING_API_URL=http://localhost:4000
//   PAYMENTS_API_URL=http://localhost:4000
//   SHIPPING_SERVICE_TOKEN=dev_mock_token
//   PAYMENTS_SERVICE_TOKEN=dev_mock_token

const http = require("http");
const PORT = Number(process.env.MOCK_PORT || 4000);

function respond(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw || "{}"));
      } catch {
        resolve({});
      }
    });
  });
}

let shipCount = 1;

const server = http.createServer(async (req, res) => {
  const [path, qs] = (req.url ?? "").split("?");
  const query = new URLSearchParams(qs ?? "");
  const token = req.headers["x-service-token"];

  console.log(`[mock] ${req.method} ${req.url}  token=${token ? "ok" : "MISSING"}`);

  if (!token) {
    return respond(res, 401, {
      error: { code: "UNAUTHORIZED", message: "Missing X-Service-Token" },
    });
  }

  // ── Shipping App: POST /api/v1/shipments ─────────────────────
  if (req.method === "POST" && path === "/api/v1/shipments") {
    const body = await readBody(req);
    const shipment = {
      id: `mock_ship_${String(shipCount++).padStart(4, "0")}`,
      order_id: body.order_id ?? null,
      sales_order_id: body.sales_order_id ?? null,
      seller_profile_id: body.seller_profile_id ?? null,
      status: "pending",
      tracking_number: `MOCK${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    console.log(`[mock] Created shipment ${shipment.id} for sales_order ${shipment.sales_order_id}`);
    return respond(res, 201, shipment);
  }

  // ── Payments App: GET /api/v1/settlements ────────────────────
  if (req.method === "GET" && path === "/api/v1/settlements") {
    const sellerId = query.get("sellerId");
    return respond(res, 200, {
      data: [
        {
          id: "mock_sett_0001",
          seller_id: sellerId,
          amount_cents: 125000,
          currency: "ARS",
          status: "pending",
          period_from: "2026-04-01",
          period_to: "2026-04-30",
          created_at: new Date().toISOString(),
        },
        {
          id: "mock_sett_0002",
          seller_id: sellerId,
          amount_cents: 289500,
          currency: "ARS",
          status: "settled",
          period_from: "2026-03-01",
          period_to: "2026-03-31",
          settled_at: "2026-04-05T10:00:00.000Z",
          created_at: "2026-04-01T00:00:00.000Z",
        },
      ],
      pagination: { total: 2, page: 1, limit: 20, has_more: false },
    });
  }

  return respond(res, 404, {
    error: { code: "NOT_FOUND", message: `No mock handler for ${req.method} ${path}` },
  });
});

server.listen(PORT, () => {
  console.log(`\nMock server running on http://localhost:${PORT}`);
  console.log(`  POST /api/v1/shipments   -> fake Shipping App`);
  console.log(`  GET  /api/v1/settlements -> fake Payments App`);
  console.log(`\nAccepts any non-empty X-Service-Token header.\n`);
});
