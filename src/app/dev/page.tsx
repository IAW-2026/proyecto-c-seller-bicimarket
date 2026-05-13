import { prisma } from "@/lib/prisma";
import { formatSalesOrder } from "@/app/api/v1/sales-orders/_format";
import { DevSimulator } from "./_components/DevSimulator";

export const dynamic = "force-dynamic";

export default async function DevPage() {
  if (process.env.NODE_ENV !== "development") {
    return (
      <main className="p-8">
        <p className="text-destructive">This page is only available in development mode.</p>
      </main>
    );
  }

  const [products, orders] = await Promise.all([
    prisma.product.findMany({
      where: { status: "active", deletedAt: null },
      select: { id: true, title: true, priceCents: true, currency: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.salesOrder.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-2">
      <div className="rounded-md border border-yellow-400 bg-yellow-50 px-4 py-2 text-sm text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
        Dev simulator — only visible in development. Simulates inter-app calls without running the other apps.
      </div>

      <h1 className="text-2xl font-bold pt-4">Inter-app Simulator</h1>

      <DevSimulator
        products={products}
        initialOrders={orders.map((o) => {
          const f = formatSalesOrder(o);
          return { ...f, created_at: f.created_at.toISOString() };
        })}
      />
    </main>
  );
}
