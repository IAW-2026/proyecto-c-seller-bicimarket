import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/products — lista todos los productos
export async function GET() {
  
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

// POST /api/products — crea un producto
export async function POST(request: NextRequest) {
  const body = await request.json();

  const { title, description } = body;

  if (!title || !description) {
    return NextResponse.json(
      { error: "title y description son requeridos" },
      { status: 400 }
    );
  }

  const product = await prisma.product.create({
    data: { title, description },
  });

  return NextResponse.json(product, { status: 201 });
}
