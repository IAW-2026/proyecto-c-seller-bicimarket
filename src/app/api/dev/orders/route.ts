import { prisma } from "@/lib/prisma";
import { formatSalesOrder } from "@/app/api/v1/sales-orders/_format";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "Dev only" }, { status: 403 });
  }

  const orders = await prisma.salesOrder.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return Response.json(
    orders.map((o) => {
      const f = formatSalesOrder(o);
      return { ...f, created_at: f.created_at.toISOString() };
    })
  );
}
