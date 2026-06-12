"use client";

import { use, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import {
  useSalesOrder,
  useAcceptOrder,
  useRejectOrder,
  usePrepareOrder,
} from "@/hooks/use-sales-orders";
import type { SalesOrder } from "@/hooks/use-sales-orders";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatCents } from "@/lib/format";
import { OrderFlow } from "./_components/order-flow";

// ── Maps ─────────────────────────────────────────────────────

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

const PAYMENT_LABEL: Record<SalesOrder["payment_status"], string> = {
  pending: "Pendiente",
  paid: "Pagado",
  refunded: "Reembolsado",
  settled: "Liquidado",
};

// ── Page ─────────────────────────────────────────────────────

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: order, isLoading, error } = useSalesOrder(id);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const accept = useAcceptOrder();
  const reject = useRejectOrder();
  const prepare = usePrepareOrder();
  const busy = accept.isPending || reject.isPending || prepare.isPending;

  async function handleAccept() {
    try {
      await accept.mutateAsync(id);
      toast.success("Pedido aceptado");
    } catch {
      toast.error("No se pudo aceptar el pedido");
    }
  }

  async function handleReject() {
    try {
      await reject.mutateAsync({ salesOrderId: id, reason: rejectReason });
      toast.success("Pedido rechazado — se iniciará el reembolso al comprador");
      setRejectOpen(false);
      setRejectReason("");
    } catch {
      toast.error("No se pudo rechazar el pedido");
    }
  }

  async function handlePrepare(status: "preparing" | "ready_to_ship") {
    try {
      await prepare.mutateAsync({ salesOrderId: id, fulfillment_status: status });
      toast.success(
        status === "ready_to_ship"
          ? "Pedido marcado como listo — se notificó a logística"
          : "Preparación iniciada"
      );
    } catch {
      toast.error("No se pudo actualizar el pedido");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/orders"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> Volver a pedidos
        </Link>
        <p className="text-sm text-destructive">Pedido no encontrado.</p>
      </div>
    );
  }

  const addr = order.shipping_address_snapshot;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Breadcrumb */}
      <Link
        href="/dashboard/orders"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Volver a pedidos
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold leading-tight">Pedido</h1>
          <p className="font-mono text-sm text-muted-foreground mt-0.5">{order.id}</p>
        </div>
        <Badge variant={STATUS_VARIANT[order.fulfillment_status] ?? "outline"}>
          {STATUS_LABEL[order.fulfillment_status] ?? order.fulfillment_status}
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {order.fulfillment_status === "pending" && (
          <>
            <Button size="sm" disabled={busy} onClick={handleAccept}>
              Aceptar
            </Button>
            <Button size="sm" variant="destructive" disabled={busy} onClick={() => setRejectOpen(true)}>
              Rechazar
            </Button>
          </>
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
          <span className="text-sm text-muted-foreground">Esperando retiro por logística</span>
        )}
        {order.fulfillment_status === "handed_over" && (
          <span className="text-sm text-muted-foreground">En camino al comprador</span>
        )}
      </div>

      {/* Flujo de estado */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Estado del pedido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OrderFlow status={order.fulfillment_status} />
        </CardContent>
      </Card>

      {/* Status summary */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{PAYMENT_LABEL[order.payment_status]}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{formatCents(order.total_cents, order.currency)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fecha</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              {new Date(order.created_at).toLocaleDateString("es-AR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Productos ({order.items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-center">Cant.</TableHead>
                <TableHead className="text-right">P. unitario</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-sm">{item.product_name_snapshot}</TableCell>
                  <TableCell className="text-center text-sm">{item.quantity}</TableCell>
                  <TableCell className="text-right text-sm">
                    {formatCents(item.unit_price_cents, order.currency)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {formatCents(item.unit_price_cents * item.quantity, order.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardContent className="pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal productos</span>
            <span>{formatCents(order.items_subtotal_cents, order.currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Envío</span>
            <span>{formatCents(order.shipping_cost_cents, order.currency)}</span>
          </div>
          <div className="flex justify-between font-semibold border-t pt-2">
            <span>Total</span>
            <span>{formatCents(order.total_cents, order.currency)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Shipping address */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Dirección de envío</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-0.5">
          <p>{addr.street} {addr.number}</p>
          <p>{addr.city}, {addr.province} ({addr.postal_code})</p>
          <p>{addr.country}</p>
        </CardContent>
      </Card>

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
            <Button variant="destructive" disabled={busy} onClick={handleReject}>
              Confirmar rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
