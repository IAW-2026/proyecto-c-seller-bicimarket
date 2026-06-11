import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const shippingUrl = process.env.SHIPPING_API_URL?.replace(/\/$/, "");
  if (!shippingUrl) {
    return NextResponse.json({ data: [] });
  }

  const q = request.nextUrl.searchParams.get("q");
  const upstream = new URL(`${shippingUrl}/api/v1/postal-codes`);
  if (q) upstream.searchParams.set("q", q);

  try {
    const res = await fetch(upstream.toString(), {
      next: { revalidate: 3600 },
    });
    const json = await res.json();
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ data: [] });
  }
}
