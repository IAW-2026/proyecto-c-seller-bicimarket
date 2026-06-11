"use client";

import { useState } from "react";
import { useAdminSalesOrders, type AdminSalesOrder } from "@/hooks/use-admin-sales-orders";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ── Label maps ────────────────────────────────────────────────

const FULFILLMENT_LABEL: Record<string, string> = {
  pending: "Pendiente",
  accepted: "Aceptado",
  rejected: "Rechazado",
  preparing: "Preparando",
  ready_to_ship: "Listo para enviar",
  handed_over: "Entregado a courier",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const FULFILLMENT_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "secondary",
  accepted: "default",
  rejected: "destructive",
  preparing: "default",
  ready_to_ship: "default",
  handed_over: "outline",
  delivered: "outline",
  cancelled: "destructive",
};

const PAYMENT_LABEL: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  refunded: "Reembolsado",
  settled: "Liquidado",
};

const PAYMENT_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "secondary",
  paid: "default",
  refunded: "destructive",
  settled: "outline",
};

// ── Helpers ───────────────────────────────────────────────────

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function shortId(id: string) {
  return id.slice(-8);
}

// ── Skeleton ──────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-5 w-28 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell className="text-right"><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

// ── Row ───────────────────────────────────────────────────────

function OrderRow({ order }: { order: AdminSalesOrder }) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs text-muted-foreground">
        …{shortId(order.id)}
      </TableCell>
      <TableCell className="text-sm">{order.seller_display_name}</TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">
        …{shortId(order.buyer_profile_id)}
      </TableCell>
      <TableCell>
        <Badge variant={FULFILLMENT_VARIANT[order.fulfillment_status] ?? "secondary"}>
          {FULFILLMENT_LABEL[order.fulfillment_status] ?? order.fulfillment_status}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={PAYMENT_VARIANT[order.payment_status] ?? "secondary"}>
          {PAYMENT_LABEL[order.payment_status] ?? order.payment_status}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground text-center">
        {order.items_count}
      </TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {formatPrice(order.total_cents, order.currency)}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
        {new Date(order.created_at).toLocaleDateString("es-AR")}
      </TableCell>
    </TableRow>
  );
}

// ── Main component ────────────────────────────────────────────

export function AdminOrdersList() {
  const [fulfillmentStatus, setFulfillmentStatus] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useAdminSalesOrders({
    fulfillment_status: fulfillmentStatus || undefined,
    payment_status: paymentStatus || undefined,
    page,
  });

  function handleFulfillmentChange(val: string) {
    setFulfillmentStatus(val === "all" ? "" : val);
    setPage(1);
  }

  function handlePaymentChange(val: string) {
    setPaymentStatus(val === "all" ? "" : val);
    setPage(1);
  }

  const orders = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={fulfillmentStatus || "all"} onValueChange={handleFulfillmentChange}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Estado de fulfillment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="accepted">Aceptado</SelectItem>
            <SelectItem value="rejected">Rechazado</SelectItem>
            <SelectItem value="preparing">Preparando</SelectItem>
            <SelectItem value="ready_to_ship">Listo para enviar</SelectItem>
            <SelectItem value="handed_over">Entregado a courier</SelectItem>
            <SelectItem value="delivered">Entregado</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={paymentStatus || "all"} onValueChange={handlePaymentChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado de pago" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los pagos</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="paid">Pagado</SelectItem>
            <SelectItem value="refunded">Reembolsado</SelectItem>
            <SelectItem value="settled">Liquidado</SelectItem>
          </SelectContent>
        </Select>

        {pagination && (
          <span className="ml-auto text-xs text-muted-foreground">
            {pagination.total} orden{pagination.total !== 1 ? "es" : ""}
          </span>
        )}
      </div>

      {/* Table */}
      {error ? (
        <p className="text-sm text-destructive">Error al cargar las órdenes.</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">ID</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Comprador</TableHead>
                <TableHead>Fulfillment</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <SkeletonRows />
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    No hay órdenes con los filtros seleccionados.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => <OrderRow key={o.id} order={o} />)
              )}
            </TableBody>
          </Table>

          {pagination && (
            <div className="flex items-center justify-between border-t px-4 py-2">
              <p className="text-xs text-muted-foreground">
                Página {pagination.page} · mostrando {orders.length} de {pagination.total}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={!pagination.has_more}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
