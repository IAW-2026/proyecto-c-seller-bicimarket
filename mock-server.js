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

// In-memory settlements — starts empty; populated when dev simulator fires "settled"
const settlements = [];

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

  // ── Payments App: POST /api/v1/settlements ───────────────────
  // Called by the dev simulator when payment_status = "settled"
  if (req.method === "POST" && path === "/api/v1/settlements") {
    const body = await readBody(req);
    const gross = Number(body.gross_amount_cents ?? 0);
    const fee = Math.round(gross * 0.10);
    const settlement = {
      id: `mock_sett_${String(settlements.length + 1).padStart(4, "0")}`,
      order_id: body.order_id ?? "unknown",
      seller_profile_id: body.seller_profile_id ?? null,
      gross_amount_cents: gross,
      fee_amount_cents: fee,
      net_amount_cents: gross - fee,
      currency: body.currency ?? "ARS",
      status: "pending",
      paid_at: null,
      created_at: new Date().toISOString(),
    };
    settlements.push(settlement);
    console.log(`[mock] Created settlement ${settlement.id} for order ${settlement.order_id} — gross $${(gross / 100).toFixed(2)}`);
    return respond(res, 201, settlement);
  }

  // ── Payments App: GET /api/v1/settlements ────────────────────
  if (req.method === "GET" && path === "/api/v1/settlements") {
    const sellerId = query.get("sellerId");
    const statusFilter = query.get("status");

    let result = sellerId
      ? settlements.filter((s) => s.seller_profile_id === sellerId)
      : settlements;

    if (statusFilter) {
      result = result.filter((s) => s.status === statusFilter);
    }

    if (result.length === 0) {
      console.log(`[mock] No settlements found for sellerId=${sellerId} — returning empty list`);
    }

    return respond(res, 200, {
      data: result,
      pagination: { total: result.length, page: 1, limit: 20, has_more: false },
    });
  }

  // ── Payments App: POST /api/v1/payments/:id/refund ───────────
  if (req.method === "POST" && /^\/api\/v1\/payments\/[^/]+\/refund$/.test(path)) {
    const body = await readBody(req);
    console.log(`[mock] Refund requested for payment — amount: ${body.amount_cents}, reason: ${body.reason}`);
    return respond(res, 200, {
      id: `mock_refund_${Date.now()}`,
      status: "approved",
      amount_cents: body.amount_cents,
    });
  }

  return respond(res, 404, {
    error: { code: "NOT_FOUND", message: `No mock handler for ${req.method} ${path}` },
  });
});

server.listen(PORT, () => {
  console.log(`\nMock server running on http://localhost:${PORT}`);
  console.log(`  POST /api/v1/shipments             -> fake Shipping App`);
  console.log(`  POST /api/v1/settlements           -> register settlement (called by dev simulator)`);
  console.log(`  GET  /api/v1/settlements           -> list settlements`);
  console.log(`  POST /api/v1/payments/:id/refund   -> fake refund`);
  console.log(`\nSettlements start empty and are created when you simulate "settled" in /dev.\n`);
  console.log(`Accepts any non-empty X-Service-Token header.\n`);
});
