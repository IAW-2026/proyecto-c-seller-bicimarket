"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  useAcceptOrder,
  usePrepareOrder,
  useRejectOrder,
  useSalesOrders,
  type SalesOrder,
} from "@/hooks/use-sales-orders";
import { useSellerProfile } from "@/hooks/use-seller-profile";
import { Package, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatCents } from "@/lib/format";

// ── Status maps ──────────────────────────────────────────────

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

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  accepted: "default",
  preparing: "default",
  ready_to_ship: "default",
  handed_over: "outline",
  delivered: "outline",
  rejected: "destructive",
  cancelled: "destructive",
};

// ── Order row ────────────────────────────────────────────────

function OrderRow({ order }: { order: SalesOrder }) {
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
      toast.success(
        status === "ready_to_ship" ? "Pedido marcado como listo — se notificó a logística" : "Preparación iniciada"
      );
    } catch {
      toast.error("No se pudo actualizar el pedido");
    }
  }

  const itemsSummary =
    order.items.length === 1
      ? order.items[0].product_name_snapshot.length > 28
        ? order.items[0].product_name_snapshot.slice(0, 28) + "…"
        : order.items[0].product_name_snapshot
      : `${order.items.length} productos`;

  return (
    <>
      <TableRow>
        <TableCell>
          <p className="font-mono text-xs leading-tight">{order.id.slice(0, 14)}…</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(order.created_at).toLocaleDateString("es-AR")}
          </p>
        </TableCell>
        <TableCell className="text-sm text-muted-foreground max-w-48 truncate">
          {itemsSummary}
        </TableCell>
        <TableCell className="font-semibold text-sm">
          {formatCents(order.total_cents)}
        </TableCell>
        <TableCell>
          <Badge variant={STATUS_VARIANT[order.fulfillment_status] ?? "outline"}>
            {STATUS_LABEL[order.fulfillment_status] ?? order.fulfillment_status}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex gap-1.5 flex-wrap">
            <Link href={`/dashboard/orders/${order.id}`}>
              <Button size="sm" variant="outline">Ver</Button>
            </Link>
          {order.fulfillment_status === "pending" && (
            <div className="flex gap-1.5">
              <Button size="sm" disabled={busy} onClick={handleAccept}>
                Aceptar
              </Button>
              <Button size="sm" variant="destructive" disabled={busy} onClick={() => setRejectOpen(true)}>
                Rechazar
              </Button>
            </div>
          )}
          {order.fulfillment_status === "accepted" && (
            <Button size="sm" disabled={busy} onClick={() => handlePrepare("preparing")}>
              Iniciar preparación
            </Button>
          )}
          {order.fulfillment_status === "preparing" && (
            <Button size="sm" disabled={busy} onClick={() => handlePrepare("ready_to_ship")}>
              Listo para envío
            </Button>
          )}
          {order.fulfillment_status === "ready_to_ship" && (
            <span className="text-xs text-muted-foreground">Esperando retiro</span>
          )}
          {order.fulfillment_status === "handed_over" && (
            <span className="text-xs text-muted-foreground">En camino al comprador</span>
          )}
          {["delivered", "rejected", "cancelled"].includes(order.fulfillment_status) && (
            <span className="text-xs text-muted-foreground">—</span>
          )}
          </div>
        </TableCell>
      </TableRow>

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
            <Button variant="destructive" disabled={busy} onClick={handleReject}>
              Confirmar rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Tab ──────────────────────────────────────────────────────

export function OrdersTab() {
  const { data: profile, isLoading: profileLoading } = useSellerProfile();
  const { data, isLoading, error } = useSalesOrders();

  if (isLoading || profileLoading) {
    return <p className="text-sm text-muted-foreground">Cargando pedidos…</p>;
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
          <Package className="size-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium">Completá tu perfil de vendedor</p>
        <p className="text-xs text-muted-foreground">
          Necesitás crear tu perfil antes de poder recibir pedidos.
        </p>
      </div>
    );
  }

  if (profile.verification_status !== "verified") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
          <Clock className="size-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium">Cuenta pendiente de activación</p>
        <p className="text-xs text-muted-foreground">
          Tu perfil está en revisión. Una vez verificado podrás ver y gestionar tus pedidos.
        </p>
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

  const stats = [
    { label: "Nuevos", value: orders.filter((o) => o.fulfillment_status === "pending").length },
    {
      label: "En preparación",
      value: orders.filter((o) => ["accepted", "preparing"].includes(o.fulfillment_status)).length,
    },
    {
      label: "Listos para envío",
      value: orders.filter((o) => o.fulfillment_status === "ready_to_ship").length,
    },
    { label: "Entregados", value: orders.filter((o) => o.fulfillment_status === "delivered").length },
  ];

  return (
    <div className="space-y-6">
      <h3 className="font-heading text-base font-semibold">Pedidos</h3>

      {/* Stat boxes */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-mono text-2xl font-semibold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active orders table */}
      {active.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <Package className="size-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="text-sm text-muted-foreground">No hay pedidos activos.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Producto(s)</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {active.map((o) => (
              <OrderRow key={o.id} order={o} />
            ))}
          </TableBody>
        </Table>
      )}

      {/* Closed orders table */}
      {closed.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-heading text-sm font-semibold text-muted-foreground">Historial</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Producto(s)</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {closed.map((o) => (
                <OrderRow key={o.id} order={o} />
              ))}
            </TableBody>
          </Table>
        </section>
      )}
    </div>
  );
}
