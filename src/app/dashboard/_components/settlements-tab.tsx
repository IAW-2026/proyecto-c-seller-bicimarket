"use client";

import { useState } from "react";
import { useSettlements, type Settlement } from "@/hooks/use-settlements";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCents } from "@/lib/format";

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

function SettlementRow({ s }: { s: Settlement }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-mono text-muted-foreground truncate">{s.id.slice(0, 16)}…</p>
          <p className="text-xs text-muted-foreground">
            Orden {s.order_id.slice(0, 12)}… · {new Date(s.created_at).toLocaleDateString("es-AR")}
          </p>
          {s.paid_at && (
            <p className="text-xs text-muted-foreground">
              Acreditado: {new Date(s.paid_at).toLocaleDateString("es-AR")}
            </p>
          )}
        </div>

        <div className="text-right shrink-0 space-y-1">
          <Badge variant={STATUS_VARIANT[s.status]}>{STATUS_LABEL[s.status]}</Badge>
          <div className="text-sm">
            <span className="text-muted-foreground line-through mr-1">{formatCents(s.gross_amount_cents)}</span>
            <span className="font-semibold">{formatCents(s.net_amount_cents)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Comisión: {formatCents(s.fee_amount_cents)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function SettlementsTab() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data, isLoading, error } = useSettlements(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  );

  const settlements = data?.data ?? [];
  const pagination = data?.pagination;

  const paidTotal = settlements
    .filter((s) => s.status === "paid")
    .reduce((acc, s) => acc + s.net_amount_cents, 0);
  const pendingTotal = settlements
    .filter((s) => s.status === "pending")
    .reduce((acc, s) => acc + s.net_amount_cents, 0);
  const feesTotal = settlements.reduce((acc, s) => acc + s.fee_amount_cents, 0);

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-lg border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
        <span>
          Las liquidaciones se acreditan después de la entrega confirmada. La comisión del
          marketplace ya se descuenta en el monto neto.
        </span>
      </div>

      {/* Stat cards */}
      {!error && !isLoading && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Total liquidado", value: formatCents(paidTotal), accent: true },
            { label: "Pendiente de acreditación", value: formatCents(pendingTotal) },
            { label: "Comisión cobrada", value: formatCents(feesTotal), sub: "10% sobre el bruto" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <p
                  className={`mt-1 font-mono text-2xl font-semibold ${
                    s.accent ? "text-primary" : ""
                  }`}
                >
                  {s.value}
                </p>
                {s.sub && <p className="mt-0.5 text-xs text-muted-foreground">{s.sub}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-heading text-base font-semibold">Liquidaciones</h3>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="paid">Acreditado</SelectItem>
            <SelectItem value="failed">Fallido</SelectItem>
            <SelectItem value="manual_review">Revisión manual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando liquidaciones…</p>}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-muted-foreground">
          No se pudo conectar con el servicio de pagos. Las liquidaciones no están disponibles en este momento.
        </div>
      )}

      {!isLoading && !error && settlements.length === 0 && (
        <p className="text-sm text-muted-foreground">No hay liquidaciones para mostrar.</p>
      )}

      <div className="space-y-2">
        {settlements.map((s) => (
          <SettlementRow key={s.id} s={s} />
        ))}
      </div>

      {pagination && pagination.has_more && (
        <Button variant="outline" className="w-full" size="sm" disabled>
          Ver más ({pagination.total - settlements.length} restantes)
        </Button>
      )}
    </div>
  );
}
