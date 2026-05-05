// Legacy route — redirects to the versioned API
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = url.pathname.replace("/api/products", "/api/v1/products");
  return NextResponse.redirect(url, 308);
}

export async function POST(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = url.pathname.replace("/api/products", "/api/v1/products");
  return NextResponse.redirect(url, 308);
}
