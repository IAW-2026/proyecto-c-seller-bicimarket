import { NextRequest } from "next/server";
import { requireSellerProfile } from "@/lib/api-utils";
import { interAppCall } from "@/lib/inter-app";

export async function GET(request: NextRequest) {
  const { profile, error } = await requireSellerProfile();
  if (error) return error;

  const paymentsUrl = process.env.PAYMENTS_API_URL;
  const token = process.env.PAYMENTS_SERVICE_TOKEN;

  if (!paymentsUrl || !token) {
    return Response.json(
      { error: { code: "SERVICE_UNAVAILABLE", message: "Payments App not configured" } },
      { status: 503 }
    );
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
