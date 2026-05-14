"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useAcceptOrder,
  usePrepareOrder,
  useRejectOrder,
  useSalesOrders,
  type SalesOrder,
} from "@/hooks/use-sales-orders";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { formatCents } from "@/lib/format";

// ── Status badge ────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  accepted: "Aceptado",
  preparing: "Preparando",
  ready_to_ship: "Listo para envío",
  handed_over: "Despachado",
  delivered: "Entregado",
  rejected: "Rechazado",
  cancelled: "Cancelado",
};

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  accepted: "default",
  preparing: "default",
  ready_to_ship: "default",
  handed_over: "outline",
  delivered: "outline",
  rejected: "destructive",
  cancelled: "destructive",
};

// ── Order card ───────────────────────────────────────────────

function OrderCard({ order }: { order: SalesOrder }) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const accept = useAcceptOrder();
  const reject = useRejectOrder();
  const prepare = usePrepareOrder();

  const busy = accept.isPending || reject.isPending || prepare.isPending;

  async function handleAccept() {
    try {
      await accept.mutateAsync(order.id);
      toast.success("Pedido aceptado");
    } catch {
      toast.error("No se pudo aceptar el pedido");
    }
  }

  async function handleReject() {
    try {
      await reject.mutateAsync({ salesOrderId: order.id, reason: rejectReason });
      toast.success("Pedido rechazado — se iniciará el reembolso al comprador");
      setRejectOpen(false);
      setRejectReason("");
    } catch {
      toast.error("No se pudo rechazar el pedido");
    }
  }

  async function handlePrepare(status: "preparing" | "ready_to_ship") {
    try {
      await prepare.mutateAsync({ salesOrderId: order.id, fulfillment_status: status });
      const msg =
        status === "ready_to_ship"
          ? "Pedido marcado como listo — se notificó a logística"
          : "Preparación iniciada";
      toast.success(msg);
    } catch {
      toast.error("No se pudo actualizar el pedido");
    }
  }

  const addr = order.shipping_address_snapshot;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-mono text-muted-foreground">
              {order.id.slice(0, 16)}…
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Orden {order.order_id.slice(0, 12)}… · {new Date(order.created_at).toLocaleDateString("es-AR")}
            </p>
          </div>
          <Badge variant={STATUS_VARIANT[order.fulfillment_status] ?? "outline"}>
            {STATUS_LABEL[order.fulfillment_status] ?? order.fulfillment_status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Items */}
        <ul className="space-y-1 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between">
              <span className="text-muted-foreground">
                {item.quantity}× {item.product_name_snapshot}
              </span>
              <span className="font-medium">{formatCents(item.unit_price_cents * item.quantity)}</span>
            </li>
          ))}
        </ul>

        <Separator />

        {/* Totals */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal productos</span>
            <span>{formatCents(order.items_subtotal_cents)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Costo de envío</span>
            <span>{formatCents(order.shipping_cost_cents)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatCents(order.total_cents)}</span>
          </div>
        </div>

        {/* Shipping address */}
        {addr && (
          <p className="text-xs text-muted-foreground">
            Envío a: {addr.street} {addr.number}, {addr.city}, {addr.province}
          </p>
        )}

        {/* Action buttons — depend on current fulfillment_status */}
        {order.fulfillment_status === "pending" && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="flex-1"
              disabled={busy}
              onClick={handleAccept}
            >
              Aceptar pedido
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1"
              disabled={busy}
              onClick={() => setRejectOpen(true)}
            >
              Rechazar
            </Button>
          </div>
        )}

        {order.fulfillment_status === "accepted" && (
          <Button
            size="sm"
            className="w-full"
            disabled={busy}
            onClick={() => handlePrepare("preparing")}
          >
            Iniciar preparación
          </Button>
        )}

        {order.fulfillment_status === "preparing" && (
          <Button
            size="sm"
            className="w-full"
            disabled={busy}
            onClick={() => handlePrepare("ready_to_ship")}
          >
            Listo para envío — notificar logística
          </Button>
        )}

        {["ready_to_ship", "handed_over", "delivered"].includes(order.fulfillment_status) && (
          <p className="text-center text-xs text-muted-foreground pt-1">
            {order.fulfillment_status === "ready_to_ship" && "Esperando retiro por logística"}
            {order.fulfillment_status === "handed_over" && "En camino al comprador"}
            {order.fulfillment_status === "delivered" && "Entregado al comprador"}
          </p>
        )}
      </CardContent>

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar pedido</DialogTitle>
            <DialogDescription>
              Se iniciará un reembolso al comprador. Indicá el motivo del rechazo.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            aria-label="Motivo del rechazo"
            placeholder="Ej: Producto dañado al revisar antes del despacho"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={handleReject}
            >
              Confirmar rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ── Tab ──────────────────────────────────────────────────────

function OrdersSkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="flex justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-36" />
                <Skeleton className="h-3 w-44" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Separator />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-8 w-full rounded-md" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function OrdersTab() {
  const { data, isLoading, error } = useSalesOrders();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h3 className="font-heading text-base font-semibold">Pedidos activos</h3>
        <OrdersSkeletonGrid />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">Error al cargar pedidos</p>;
  }

  const orders = data?.data ?? [];
  const active = orders.filter(
    (o) => !["rejected", "cancelled", "delivered"].includes(o.fulfillment_status)
  );
  const closed = orders.filter((o) =>
    ["rejected", "cancelled", "delivered"].includes(o.fulfillment_status)
  );

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 font-heading text-base font-semibold">
          Pedidos activos ({active.length})
        </h3>
        {active.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <Package className="size-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="text-sm text-muted-foreground">No hay pedidos activos.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {active.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        )}
      </section>

      {closed.length > 0 && (
        <section>
          <h3 className="mb-3 font-heading text-base font-semibold text-muted-foreground">
            Historial
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {closed.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
