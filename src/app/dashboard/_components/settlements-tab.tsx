"use client";

import { useState } from "react";
import { useSettlements, type Settlement } from "@/hooks/use-settlements";
import { useSellerProfile } from "@/hooks/use-seller-profile";
import {
  Wallet,
  Clock,
  CheckCircle,
  TrendingDown,
  Search,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Stagger, StaggerItem } from "@/components/motion";
import { formatCents } from "@/lib/format";

// ── Status maps ──────────────────────────────────────────────

const STATUS_LABEL: Record<Settlement["status"], string> = {
  pending: "Pendiente",
  paid: "Acreditado",
  failed: "Fallido",
  manual_review: "Revisión manual",
};

const STATUS_VARIANT: Record<
  Settlement["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  paid: "default",
  failed: "destructive",
  manual_review: "outline",
};

// ── Sort ──────────────────────────────────────────────────────

type SettlementSortKey = "date" | "net";
type SortDir = "asc" | "desc";

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="size-3 opacity-40" />;
  return dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />;
}

// ── Table header ──────────────────────────────────────────────

function SettlementsTableHeader({
  sortKey,
  sortDir,
  onSort,
}: {
  sortKey: SettlementSortKey;
  sortDir: SortDir;
  onSort: (key: SettlementSortKey) => void;
}) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>
          <button
            className="flex items-center gap-1 hover:text-foreground transition-colors"
            onClick={() => onSort("date")}
          >
            Liquidación
            <SortIndicator active={sortKey === "date"} dir={sortDir} />
          </button>
        </TableHead>
        <TableHead>Orden</TableHead>
        <TableHead className="text-right">Bruto</TableHead>
        <TableHead className="text-right">Comisión</TableHead>
        <TableHead className="text-right">
          <button
            className="flex items-center gap-1 hover:text-foreground transition-colors ml-auto"
            onClick={() => onSort("net")}
          >
            Neto
            <SortIndicator active={sortKey === "net"} dir={sortDir} />
          </button>
        </TableHead>
        <TableHead>Estado</TableHead>
      </TableRow>
    </TableHeader>
  );
}

// ── Settlement row ────────────────────────────────────────────

function SettlementRow({ s }: { s: Settlement }) {
  return (
    <TableRow className="transition-colors">
      <TableCell>
        <p className="font-mono text-xs leading-tight">{s.id.slice(0, 14)}…</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {new Date(s.created_at).toLocaleDateString("es-AR")}
        </p>
      </TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">
        {s.order_id.slice(0, 12)}…
      </TableCell>
      <TableCell className="text-right text-sm text-muted-foreground line-through">
        {formatCents(s.gross_amount_cents)}
      </TableCell>
      <TableCell className="text-right text-sm text-muted-foreground">
        {formatCents(s.fee_amount_cents)}
      </TableCell>
      <TableCell className="text-right">
        <p className="font-semibold text-sm">{formatCents(s.net_amount_cents)}</p>
        {s.paid_at && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(s.paid_at).toLocaleDateString("es-AR")}
          </p>
        )}
      </TableCell>
      <TableCell>
        <Badge variant={STATUS_VARIANT[s.status]}>{STATUS_LABEL[s.status]}</Badge>
      </TableCell>
    </TableRow>
  );
}

// ── Skeleton loading ──────────────────────────────────────────

function SettlementsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="px-4 py-3 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}

// ── Tab ──────────────────────────────────────────────────────

export function SettlementsTab() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SettlementSortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [historialOpen, setHistorialOpen] = useState(false);

  const { data: profile, isLoading: profileLoading } = useSellerProfile();
  const { data, isLoading, error } = useSettlements(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  );

  function toggleSort(key: SettlementSortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  if (isLoading || profileLoading) return <SettlementsLoadingSkeleton />;

  if (!profile) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
          <Wallet className="size-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium">Completá tu perfil de vendedor</p>
        <p className="text-xs text-muted-foreground">
          Necesitás crear tu perfil antes de ver las liquidaciones.
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
          Tu perfil está en revisión. Una vez verificado podrás ver tus liquidaciones.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-muted-foreground">
        No se pudo conectar con el servicio de pagos. Las liquidaciones no están disponibles en este momento.
      </div>
    );
  }

  const settlements = data?.data ?? [];
  const pagination = data?.pagination;

  const paidTotal = settlements
    .filter((s) => s.status === "paid")
    .reduce((acc, s) => acc + s.net_amount_cents, 0);
  const pendingTotal = settlements
    .filter((s) => s.status === "pending")
    .reduce((acc, s) => acc + s.net_amount_cents, 0);
  const feesTotal = settlements.reduce((acc, s) => acc + s.fee_amount_cents, 0);

  const stats = [
    { label: "Total acreditado", value: formatCents(paidTotal), icon: CheckCircle, color: "text-primary" },
    { label: "Pendiente de acreditación", value: formatCents(pendingTotal), icon: Clock, color: "text-warning" },
    { label: "Comisión cobrada", value: formatCents(feesTotal), icon: TrendingDown, color: "text-muted-foreground" },
  ];

  const q = search.trim().toLowerCase();

  function filterAndSort(list: Settlement[]) {
    return list
      .filter((s) => {
        if (statusFilter !== "all" && s.status !== statusFilter) return false;
        if (q && !s.id.toLowerCase().includes(q) && !s.order_id.toLowerCase().includes(q))
          return false;
        return true;
      })
      .sort((a, b) => {
        const cmp =
          sortKey === "net"
            ? a.net_amount_cents - b.net_amount_cents
            : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        return sortDir === "asc" ? cmp : -cmp;
      });
  }

  const isFiltered = statusFilter !== "all" || q.length > 0;
  const pending = filterAndSort(settlements.filter((s) => s.status === "pending"));
  const closed = filterAndSort(settlements.filter((s) => s.status !== "pending"));

  const tableHeaderProps = { sortKey, sortDir, onSort: toggleSort };

  return (
    <div className="space-y-6">
      <h3 className="font-heading text-base font-semibold">Liquidaciones</h3>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-lg border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
        Las liquidaciones se acreditan después de la entrega confirmada. La comisión del
        marketplace ya se descuenta en el monto neto.
      </div>

      {/* Stat cards */}
      <Stagger className="grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <StaggerItem key={s.label}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
                  <s.icon className={`size-4 ${s.color}`} aria-hidden="true" />
                </div>
                <p className={`font-mono text-2xl font-semibold ${s.color === "text-primary" ? "text-primary" : ""}`}>
                  {s.value}
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
            placeholder="Buscar por ID de liquidación u orden…"
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
            {(Object.entries(STATUS_LABEL) as [Settlement["status"], string][]).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {pending.length === 0 && closed.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <Wallet className="size-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="text-sm text-muted-foreground">
            {isFiltered ? "Sin resultados para esa búsqueda." : "No hay liquidaciones para mostrar."}
          </p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <Table>
              <SettlementsTableHeader {...tableHeaderProps} />
              <TableBody>
                {pending.map((s) => (
                  <SettlementRow key={s.id} s={s} />
                ))}
              </TableBody>
            </Table>
          )}

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
                  <SettlementsTableHeader {...tableHeaderProps} />
                  <TableBody>
                    {closed.map((s) => (
                      <SettlementRow key={s.id} s={s} />
                    ))}
                  </TableBody>
                </Table>
              )}
            </section>
          )}
        </>
      )}

      {pagination && pagination.has_more && (
        <Button variant="outline" className="w-full" size="sm" disabled>
          Ver más ({pagination.total - settlements.length} restantes)
        </Button>
      )}
    </div>
  );
}
