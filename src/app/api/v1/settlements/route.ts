import { NextRequest } from "next/server";
import { requireSellerProfile } from "@/lib/api-utils";
import { interAppCall } from "@/lib/inter-app";

type StubSettlement = {
  id: string;
  order_id: string;
  seller_profile_id: string;
  gross_amount_cents: number;
  fee_amount_cents: number;
  net_amount_cents: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "manual_review";
  paid_at: string | null;
  created_at: string;
};

function buildStub(sellerId: string): StubSettlement[] {
  return [
    {
      id: "stl_cm1abc001xstub0001",
      order_id: "ord_cm1xyz001xstub0001",
      seller_profile_id: sellerId,
      gross_amount_cents: 180000,
      fee_amount_cents: 18000,
      net_amount_cents: 162000,
      currency: "ARS",
      status: "paid",
      paid_at: "2025-05-10T14:00:00.000Z",
      created_at: "2025-05-08T10:00:00.000Z",
    },
    {
      id: "stl_cm1abc002xstub0002",
      order_id: "ord_cm1xyz002xstub0002",
      seller_profile_id: sellerId,
      gross_amount_cents: 95000,
      fee_amount_cents: 9500,
      net_amount_cents: 85500,
      currency: "ARS",
      status: "paid",
      paid_at: "2025-05-15T09:30:00.000Z",
      created_at: "2025-05-13T16:20:00.000Z",
    },
    {
      id: "stl_cm1abc003xstub0003",
      order_id: "ord_cm1xyz003xstub0003",
      seller_profile_id: sellerId,
      gross_amount_cents: 320000,
      fee_amount_cents: 32000,
      net_amount_cents: 288000,
      currency: "ARS",
      status: "pending",
      paid_at: null,
      created_at: "2025-05-20T11:00:00.000Z",
    },
    {
      id: "stl_cm1abc004xstub0004",
      order_id: "ord_cm1xyz004xstub0004",
      seller_profile_id: sellerId,
      gross_amount_cents: 47500,
      fee_amount_cents: 4750,
      net_amount_cents: 42750,
      currency: "ARS",
      status: "pending",
      paid_at: null,
      created_at: "2025-05-22T08:45:00.000Z",
    },
    {
      id: "stl_cm1abc005xstub0005",
      order_id: "ord_cm1xyz005xstub0005",
      seller_profile_id: sellerId,
      gross_amount_cents: 130000,
      fee_amount_cents: 13000,
      net_amount_cents: 117000,
      currency: "ARS",
      status: "failed",
      paid_at: null,
      created_at: "2025-05-18T13:10:00.000Z",
    },
    {
      id: "stl_cm1abc006xstub0006",
      order_id: "ord_cm1xyz006xstub0006",
      seller_profile_id: sellerId,
      gross_amount_cents: 210000,
      fee_amount_cents: 21000,
      net_amount_cents: 189000,
      currency: "ARS",
      status: "manual_review",
      paid_at: null,
      created_at: "2025-05-25T17:00:00.000Z",
    },
  ];
}

function stubResponse(request: NextRequest, sellerId: string) {
  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status");
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));

  let items = buildStub(sellerId);
  if (statusFilter) items = items.filter((s) => s.status === statusFilter);

  const total = items.length;
  const paged = items.slice((page - 1) * limit, page * limit);

  return Response.json({
    data: paged,
    pagination: { total, page, limit, has_more: page * limit < total },
  });
}

// Proxy to Payments App — falls back to stub data when PAYMENTS_API_URL is not configured.
export async function GET(request: NextRequest) {
  const { profile, error } = await requireSellerProfile();
  if (error) return error;

  const paymentsUrl = process.env.PAYMENTS_API_URL;
  const token = process.env.PAYMENTS_SERVICE_TOKEN;

  if (!paymentsUrl || !token) {
    return stubResponse(request, profile!.id);
  }

  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(`${paymentsUrl.replace(/\/$/, "")}/api/v1/settlements`);

  upstreamUrl.searchParams.set("sellerId", profile!.id);

  for (const key of ["status", "from", "to", "page", "limit"]) {
    const value = incomingUrl.searchParams.get(key);
    if (value != null) upstreamUrl.searchParams.set(key, value);
  }

  const result = await interAppCall("GET", upstreamUrl.toString(), token);

  if (!result.ok) {
    const status = result.status === 404 ? 404 : 502;
    return Response.json(
      { error: { code: "UPSTREAM_ERROR", message: "Could not retrieve settlements from Payments App" } },
      { status }
    );
  }

  return Response.json(result.data);
}
