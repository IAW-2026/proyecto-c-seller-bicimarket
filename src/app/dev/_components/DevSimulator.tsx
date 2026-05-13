"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// ── Types ────────────────────────────────────────────────────

type Product = {
  id: string;
  title: string;
  priceCents: number;
  currency: string;
};

type SalesOrder = {
  id: string;
  order_id: string;
  fulfillment_status: string;
  payment_status: string;
  shipping_status: string;
  total_cents: number;
  created_at: string;
  items: Array<{ id: string; product_name_snapshot: string; quantity: number; unit_price_cents: number }>;
};

// ── Helpers ──────────────────────────────────────────────────

function formatCents(cents: number, currency = "ARS") {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency }).format(cents / 100);
}

const PAYMENT_STATUSES = ["paid", "refunded", "settled"];
const SHIPPING_STATUSES = [
  "ready_for_pickup",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "returned",
];

// ── Create Order Panel ───────────────────────────────────────

function CreateOrderPanel({ products, onCreated }: { products: Product[]; onCreated: () => void }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [shippingCents, setShippingCents] = useState(50000);
  const [loading, setLoading] = useState(false);

  const selected = Object.entries(quantities).filter(([, q]) => q > 0);
  const subtotal = selected.reduce(
    (s, [id, q]) => s + (products.find((p) => p.id === id)?.priceCents ?? 0) * q,
    0
  );

  async function handleCreate() {
    if (!selected.length) {
      toast.error("Select at least one product");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/dev/simulate/sales-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: selected.map(([product_id, quantity]) => ({ product_id, quantity })),
          shipping_cost_cents: shippingCents,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(`Error ${res.status}: ${data.error ?? JSON.stringify(data)}`);
      } else {
        toast.success(`Order created: ${data.id?.slice(0, 12)}…`);
        setQuantities({});
        onCreated();
      }
    } catch (err) {
      toast.error(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">
          Simulate: Payments App → POST /api/v1/sales-orders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active products found. Activate a product first.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              {products.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex-1 truncate">{p.title}</span>
                  <span className="text-muted-foreground w-28 text-right shrink-0">
                    {formatCents(p.priceCents, p.currency)}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      className="w-6 h-6 rounded border text-center leading-none hover:bg-muted"
                      onClick={() =>
                        setQuantities((q) => ({
                          ...q,
                          [p.id]: Math.max(0, (q[p.id] ?? 0) - 1),
                        }))
                      }
                    >
                      −
                    </button>
                    <span className="w-6 text-center">{quantities[p.id] ?? 0}</span>
                    <button
                      className="w-6 h-6 rounded border text-center leading-none hover:bg-muted"
                      onClick={() =>
                        setQuantities((q) => ({ ...q, [p.id]: (q[p.id] ?? 0) + 1 }))
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex items-center justify-between text-sm gap-3">
              <label className="text-muted-foreground">Shipping cost (cents)</label>
              <input
                type="number"
                className="w-28 rounded border px-2 py-1 text-right text-sm"
                value={shippingCents}
                onChange={(e) => setShippingCents(Number(e.target.value))}
              />
            </div>

            <div className="text-sm space-y-1">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCents(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{formatCents(shippingCents)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCents(subtotal + shippingCents)}</span>
              </div>
            </div>

            <Button
              className="w-full"
              disabled={loading || !selected.length}
              onClick={handleCreate}
            >
              {loading ? "Creating…" : "Create fake order"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Order Row ────────────────────────────────────────────────

function OrderRow({ order, onUpdated }: { order: SalesOrder; onUpdated: () => void }) {
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [loadingShipping, setLoadingShipping] = useState(false);

  async function updatePayment(status: string) {
    setLoadingPayment(true);
    try {
      const res = await fetch("/api/dev/simulate/payment-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sales_order_id: order.id, payment_status: status }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(`Error: ${data.error ?? JSON.stringify(data)}`);
      else { toast.success(`Payment → ${status}`); onUpdated(); }
    } catch (err) {
      toast.error(String(err));
    } finally {
      setLoadingPayment(false);
    }
  }

  async function updateShipping(status: string) {
    setLoadingShipping(true);
    try {
      const res = await fetch("/api/dev/simulate/shipping-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sales_order_id: order.id, shipping_status: status }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(`Error: ${data.error ?? JSON.stringify(data)}`);
      else { toast.success(`Shipping → ${status}`); onUpdated(); }
    } catch (err) {
      toast.error(String(err));
    } finally {
      setLoadingShipping(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-xs text-muted-foreground">{order.id.slice(0, 20)}…</p>
            <p className="text-xs text-muted-foreground">
              {new Date(order.created_at).toLocaleString("es-AR")} · {formatCents(order.total_cents)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 text-xs">
          <span className="text-muted-foreground">Fulfillment:</span>
          <Badge variant="outline">{order.fulfillment_status}</Badge>
          <span className="text-muted-foreground ml-2">Payment:</span>
          <Badge variant="outline">{order.payment_status}</Badge>
          <span className="text-muted-foreground ml-2">Shipping:</span>
          <Badge variant="outline">{order.shipping_status}</Badge>
        </div>

        <ul className="text-xs text-muted-foreground space-y-0.5">
          {order.items.map((item) => (
            <li key={item.id}>
              {item.quantity}× {item.product_name_snapshot}
            </li>
          ))}
        </ul>

        {/* Payments App simulation */}
        <div>
          <p className="text-xs font-medium mb-1 text-muted-foreground">
            Simulate Payments App → PATCH payment-status
          </p>
          <div className="flex flex-wrap gap-1">
            {PAYMENT_STATUSES.map((s) => (
              <Button
                key={s}
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={loadingPayment || order.payment_status === s}
                onClick={() => updatePayment(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        {/* Shipping App simulation */}
        <div>
          <p className="text-xs font-medium mb-1 text-muted-foreground">
            Simulate Shipping App → PATCH shipping-status
          </p>
          <div className="flex flex-wrap gap-1">
            {SHIPPING_STATUSES.map((s) => (
              <Button
                key={s}
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={loadingShipping || order.shipping_status === s}
                onClick={() => updateShipping(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main component ───────────────────────────────────────────

export function DevSimulator({
  products,
  initialOrders,
}: {
  products: Product[];
  initialOrders: SalesOrder[];
}) {
  const [orders, setOrders] = useState<SalesOrder[]>(initialOrders);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/dev/orders", { cache: "no-store" });
      if (res.ok) setOrders(await res.json());
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1">Create order</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Simulates Payments App calling POST /api/v1/sales-orders with X-Service-Token after a payment is approved.
        </p>
        <CreateOrderPanel products={products} onCreated={refresh} />
      </div>

      <Separator />

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Existing orders</h2>
            <p className="text-sm text-muted-foreground">
              Simulate status updates from Payments and Shipping apps.
            </p>
          </div>
          <Button variant="outline" size="sm" disabled={refreshing} onClick={refresh}>
            {refreshing ? "Refreshing…" : "Refresh"}
          </Button>
        </div>

        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet. Create one above.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {orders.map((o) => (
              <OrderRow key={o.id} order={o} onUpdated={refresh} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
