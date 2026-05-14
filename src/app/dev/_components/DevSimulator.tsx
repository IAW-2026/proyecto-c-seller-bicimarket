"use client";

import { useState } from "react";
import { toast } from "sonner";
import { formatCents } from "@/lib/format";
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

// ── State machine labels ─────────────────────────────────────

const FULFILLMENT_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  accepted: "default",
  preparing: "default",
  ready_to_ship: "default",
  handed_over: "outline",
  delivered: "outline",
  rejected: "destructive",
  cancelled: "destructive",
};

const PAYMENT_STATUSES = ["paid", "refunded", "settled"];
const SHIPPING_STATUSES = [
  "ready_for_pickup",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "returned",
];

// ── Fulfillment flow diagram ─────────────────────────────────

const FLOW_STEPS = [
  { status: "pending", label: "Pendiente", actor: "Payments App" },
  { status: "accepted", label: "Aceptado", actor: "Vendedor" },
  { status: "preparing", label: "Preparando", actor: "Vendedor" },
  { status: "ready_to_ship", label: "Listo", actor: "Vendedor" },
  { status: "handed_over", label: "Despachado", actor: "Shipping App" },
  { status: "delivered", label: "Entregado", actor: "Shipping App" },
];

function FlowDiagram({ current }: { current: string }) {
  const terminal = current === "rejected" || current === "cancelled";
  return (
    <div className="flex items-center gap-1 flex-wrap text-xs">
      {terminal ? (
        <Badge variant="destructive">{current}</Badge>
      ) : (
        FLOW_STEPS.map((step, i) => {
          const idx = FLOW_STEPS.findIndex((s) => s.status === current);
          const past = i < idx;
          const active = step.status === current;
          return (
            <span key={step.status} className="flex items-center gap-1">
              <span
                className={
                  active
                    ? "font-semibold text-foreground"
                    : past
                    ? "text-muted-foreground line-through"
                    : "text-muted-foreground/50"
                }
              >
                {step.label}
              </span>
              {i < FLOW_STEPS.length - 1 && (
                <span className="text-muted-foreground/40">→</span>
              )}
            </span>
          );
        })
      )}
    </div>
  );
}

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
      toast.error("Seleccioná al menos un producto");
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
        toast.success(`Orden creada: ${data.id?.slice(0, 12)}…`);
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
          1. Simular Payments App → POST /api/v1/sales-orders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay productos activos. Activá un producto primero desde el catálogo.
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
                      aria-label={`Quitar uno de ${p.title}`}
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
                      aria-label={`Agregar uno de ${p.title}`}
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
              <label htmlFor="shipping-cost" className="text-muted-foreground">Costo de envío (centavos)</label>
              <input
                id="shipping-cost"
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
                <span>Envío</span>
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
              {loading ? "Creando…" : "Crear orden falsa"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Order Row ────────────────────────────────────────────────

function OrderRow({ order, onUpdated }: { order: SalesOrder; onUpdated: () => void }) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  async function sellerAction(action: "accept" | "reject" | "prepare", body?: object) {
    setLoadingAction(action);
    try {
      const url =
        action === "prepare"
          ? `/api/v1/sales-orders/${order.id}/prepare`
          : `/api/v1/sales-orders/${order.id}/${action}`;
      const res = await fetch(url, {
        method: action === "prepare" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(`Error: ${data.error?.message ?? JSON.stringify(data)}`);
      } else {
        toast.success(`Fulfillment → ${data.fulfillment_status}`);
        onUpdated();
      }
    } catch (err) {
      toast.error(String(err));
    } finally {
      setLoadingAction(null);
    }
  }

  async function updatePayment(status: string) {
    setLoadingAction(`pay_${status}`);
    try {
      const res = await fetch("/api/dev/simulate/payment-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sales_order_id: order.id,
          payment_status: status,
          ...(status === "settled"
            ? { settlement_id: `mock_sett_${Date.now()}` }
            : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(`Error: ${data.error ?? JSON.stringify(data)}`);
      else { toast.success(`Pago → ${status}`); onUpdated(); }
    } catch (err) {
      toast.error(String(err));
    } finally {
      setLoadingAction(null);
    }
  }

  async function updateShipping(status: string) {
    setLoadingAction(`ship_${status}`);
    try {
      const res = await fetch("/api/dev/simulate/shipping-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sales_order_id: order.id, shipping_status: status }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(`Error: ${data.error ?? JSON.stringify(data)}`);
      else { toast.success(`Envío → ${status}`); onUpdated(); }
    } catch (err) {
      toast.error(String(err));
    } finally {
      setLoadingAction(null);
    }
  }

  const busy = loadingAction !== null;
  const fs = order.fulfillment_status;

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        {/* Header */}
        <div>
          <p className="font-mono text-xs text-muted-foreground">{order.id.slice(0, 20)}…</p>
          <p className="text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleString("es-AR")} · {formatCents(order.total_cents)}
          </p>
        </div>

        {/* State badges */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
          <span className="flex items-center gap-1">
            <span className="text-muted-foreground">Fulfillment:</span>
            <Badge variant={FULFILLMENT_VARIANT[fs] ?? "outline"} className="text-xs">{fs}</Badge>
          </span>
          <span className="flex items-center gap-1">
            <span className="text-muted-foreground">Pago:</span>
            <Badge variant="outline" className="text-xs">{order.payment_status}</Badge>
          </span>
          <span className="flex items-center gap-1">
            <span className="text-muted-foreground">Envío:</span>
            <Badge variant="outline" className="text-xs">{order.shipping_status}</Badge>
          </span>
        </div>

        {/* Flow diagram */}
        <FlowDiagram current={fs} />

        {/* Items */}
        <ul className="text-xs text-muted-foreground space-y-0.5">
          {order.items.map((item) => (
            <li key={item.id}>
              {item.quantity}× {item.product_name_snapshot}
            </li>
          ))}
        </ul>

        <Separator />

        {/* 2. Seller actions */}
        <div>
          <p className="text-xs font-semibold mb-1">2. Acciones del vendedor</p>
          {fs === "pending" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={busy}
                onClick={() => sellerAction("accept")}
              >
                {loadingAction === "accept" ? "…" : "Aceptar"}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={busy}
                onClick={() => sellerAction("reject", { reason: "Simulación de rechazo" })}
              >
                {loadingAction === "reject" ? "…" : "Rechazar"}
              </Button>
            </div>
          )}
          {fs === "accepted" && (
            <Button
              size="sm"
              disabled={busy}
              onClick={() => sellerAction("prepare", { fulfillment_status: "preparing" })}
            >
              {loadingAction === "prepare" ? "…" : "Iniciar preparación"}
            </Button>
          )}
          {fs === "preparing" && (
            <Button
              size="sm"
              disabled={busy}
              onClick={() => sellerAction("prepare", { fulfillment_status: "ready_to_ship" })}
            >
              {loadingAction === "prepare" ? "…" : "Listo para envío → notifica Shipping App"}
            </Button>
          )}
          {["ready_to_ship", "handed_over", "delivered", "rejected", "cancelled"].includes(fs) && (
            <p className="text-xs text-muted-foreground">
              {fs === "ready_to_ship" && "Esperando retiro — simulá el Shipping App abajo"}
              {fs === "handed_over" && "En camino al comprador"}
              {fs === "delivered" && "✓ Entregado"}
              {(fs === "rejected" || fs === "cancelled") && "Terminal — no requiere más acciones"}
            </p>
          )}
        </div>

        {/* 3. Shipping App simulation */}
        <div>
          <p className="text-xs font-semibold mb-1">3. Simular Shipping App → PATCH shipping-status</p>
          <div className="flex flex-wrap gap-1">
            {SHIPPING_STATUSES.map((s) => (
              <Button
                key={s}
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={busy || order.shipping_status === s}
                onClick={() => updateShipping(s)}
              >
                {loadingAction === `ship_${s}` ? "…" : s}
              </Button>
            ))}
          </div>
        </div>

        {/* 4. Payment App simulation */}
        <div>
          <p className="text-xs font-semibold mb-1">4. Simular Payments App → PATCH payment-status</p>
          <p className="text-xs text-muted-foreground mb-1">
            "settled" envía un <code>settlement_id</code> mock — verificá en Liquidaciones que aparezca.
          </p>
          <div className="flex flex-wrap gap-1">
            {PAYMENT_STATUSES.map((s) => (
              <Button
                key={s}
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={busy || order.payment_status === s}
                onClick={() => updatePayment(s)}
              >
                {loadingAction === `pay_${s}` ? "…" : s}
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
      {/* Step 1: Create order */}
      <div>
        <p className="text-sm text-muted-foreground mb-4">
          Flujo completo: crear orden → acciones del vendedor → simular Shipping App → simular Payments App → verificar Liquidaciones.
        </p>
        <CreateOrderPanel products={products} onCreated={refresh} />
      </div>

      <Separator />

      {/* Steps 2–4: Per-order actions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Órdenes existentes</h2>
            <p className="text-sm text-muted-foreground">
              Cada tarjeta muestra el estado actual y las acciones disponibles en orden.
            </p>
          </div>
          <Button variant="outline" size="sm" disabled={refreshing} onClick={refresh}>
            {refreshing ? "Actualizando…" : "Actualizar"}
          </Button>
        </div>

        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay órdenes. Creá una arriba.</p>
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
