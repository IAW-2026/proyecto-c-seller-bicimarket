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
import {
  Package,
  Clock,
  Bell,
  Wrench,
  Truck,
  CheckCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Search,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Stagger, StaggerItem, AnimatedNumber } from "@/components/motion";
import { formatCents } from "@/lib/format";

// ── Types ────────────────────────────────────────────────────

type OrderSortKey = "date" | "total";
type SortDir = "asc" | "desc";

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

// ── Sort icon helper ─────────────────────────────────────────

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="size-3 opacity-40" />;
  return dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />;
}

// ── Table header ─────────────────────────────────────────────

function OrdersTableHeader({
  sortKey,
  sortDir,
  onSort,
}: {
  sortKey: OrderSortKey;
  sortDir: SortDir;
  onSort: (key: OrderSortKey) => void;
}) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>
          <button
            className="flex items-center gap-1 hover:text-foreground transition-colors"
            onClick={() => onSort("date")}
          >
            Pedido
            <SortIndicator active={sortKey === "date"} dir={sortDir} />
          </button>
        </TableHead>
        <TableHead>Producto(s)</TableHead>
        <TableHead>
          <button
            className="flex items-center gap-1 hover:text-foreground transition-colors"
            onClick={() => onSort("total")}
          >
            Total
            <SortIndicator active={sortKey === "total"} dir={sortDir} />
          </button>
        </TableHead>
        <TableHead>Estado</TableHead>
        <TableHead>Acción</TableHead>
      </TableRow>
    </TableHeader>
  );
}

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
        status === "ready_to_ship"
          ? "Pedido marcado como listo — se notificó a logística"
          : "Preparación iniciada"
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
      <TableRow className="transition-colors">
        <TableCell>
          <p className="font-mono text-xs leading-tight">{order.id.slice(0, 14)}…</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(order.created_at).toLocaleDateString("es-AR")}
          </p>
        </TableCell>
        <TableCell className="text-sm text-muted-foreground max-w-48 truncate">
          {itemsSummary}
        </TableCell>
        <TableCell className="font-semibold text-sm">{formatCents(order.total_cents)}</TableCell>
        <TableCell>
          <Badge variant={STATUS_VARIANT[order.fulfillment_status] ?? "outline"} className="gap-1.5">
            {order.fulfillment_status === "pending" && (
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-current" />
              </span>
            )}
            {STATUS_LABEL[order.fulfillment_status] ?? order.fulfillment_status}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex gap-1.5 flex-wrap">
            <Link href={`/dashboard/orders/${order.id}`}>
              <Button size="sm" variant="outline">
                Ver
              </Button>
            </Link>
            {order.fulfillment_status === "pending" && (
              <div className="flex gap-1.5">
                <Button size="sm" disabled={busy} onClick={handleAccept}>
                  Aceptar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={busy}
                  onClick={() => setRejectOpen(true)}
                >
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

// ── Skeleton loading ─────────────────────────────────────────

function OrdersLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="px-4 py-3 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-10" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}

// ── Tab ──────────────────────────────────────────────────────

export function OrdersTab() {
  const { data: profile, isLoading: profileLoading } = useSellerProfile();
  const { data, isLoading, error } = useSalesOrders();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<OrderSortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [historialOpen, setHistorialOpen] = useState(false);

  function toggleSort(key: OrderSortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  if (isLoading || profileLoading) return <OrdersLoadingSkeleton />;

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

  // Filter + sort
  const q = search.trim().toLowerCase();

  function filterAndSort(list: SalesOrder[]) {
    return list
      .filter((o) => {
        if (statusFilter !== "all" && o.fulfillment_status !== statusFilter) return false;
        if (
          q &&
          !o.id.toLowerCase().includes(q) &&
          !o.items.some((item) => item.product_name_snapshot.toLowerCase().includes(q))
        )
          return false;
        return true;
      })
      .sort((a, b) => {
        const cmp =
          sortKey === "total"
            ? a.total_cents - b.total_cents
            : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        return sortDir === "asc" ? cmp : -cmp;
      });
  }

  const isFiltered = statusFilter !== "all" || q.length > 0;

  // Always split active/closed; filters apply within each group
  const active = filterAndSort(
    orders.filter((o) => !["rejected", "cancelled", "delivered"].includes(o.fulfillment_status))
  );
  const closed = filterAndSort(
    orders.filter((o) => ["rejected", "cancelled", "delivered"].includes(o.fulfillment_status))
  );

  const stats = [
    {
      label: "Nuevos",
      value: orders.filter((o) => o.fulfillment_status === "pending").length,
      icon: Bell,
      color: "text-primary",
    },
    {
      label: "En preparación",
      value: orders.filter((o) => ["accepted", "preparing"].includes(o.fulfillment_status)).length,
      icon: Wrench,
      color: "text-warning",
    },
    {
      label: "Listos para envío",
      value: orders.filter((o) => o.fulfillment_status === "ready_to_ship").length,
      icon: Truck,
      color: "text-primary",
    },
    {
      label: "Entregados",
      value: orders.filter((o) => o.fulfillment_status === "delivered").length,
      icon: CheckCircle,
      color: "text-muted-foreground",
    },
  ];

  const tableHeaderProps = { sortKey, sortDir, onSort: toggleSort };

  return (
    <div className="space-y-6">
      <h3 className="font-heading text-base font-semibold">Pedidos</h3>

      {/* Stat boxes */}
      <Stagger className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {stats.map((s) => (
          <StaggerItem key={s.label}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
                  <s.icon className={`size-4 ${s.color}`} aria-hidden="true" />
                </div>
                <p className="font-mono text-2xl font-semibold">
                  <AnimatedNumber value={s.value} />
                </p>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-8 h-8 text-sm"
            placeholder="Buscar por ID o producto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="h-8 w-48 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(STATUS_LABEL).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active orders */}
      {active.length === 0 && closed.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <Package className="size-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="text-sm text-muted-foreground">
            {isFiltered ? "Sin resultados para esa búsqueda." : "No hay pedidos activos."}
          </p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <Table>
              <OrdersTableHeader {...tableHeaderProps} />
              <TableBody>
                {active.map((o) => (
                  <OrderRow key={o.id} order={o} />
                ))}
              </TableBody>
            </Table>
          )}

          {/* Closed orders — collapsible when hay muchos */}
          {closed.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-sm font-semibold text-muted-foreground">
                  Historial ({closed.length})
                </h3>
                {closed.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-xs gap-1"
                    onClick={() => setHistorialOpen((o) => !o)}
                  >
                    <ChevronDown
                      className={`size-3.5 transition-transform duration-200 ${historialOpen ? "rotate-180" : ""}`}
                    />
                    {historialOpen ? "Ocultar" : "Ver todos"}
                  </Button>
                )}
              </div>
              {(historialOpen || closed.length <= 3) && (
                <Table>
                  <OrdersTableHeader {...tableHeaderProps} />
                  <TableBody>
                    {closed.map((o) => (
                      <OrderRow key={o.id} order={o} />
                    ))}
                  </TableBody>
                </Table>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
