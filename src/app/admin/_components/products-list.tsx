"use client";

import { useState } from "react";
import { useAdminProducts, type AdminProduct } from "@/hooks/use-admin-products";
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

const STATUS_LABEL: Record<AdminProduct["status"], string> = {
  draft: "Borrador",
  active: "Activo",
  paused: "Pausado",
  archived: "Archivado",
};

const STATUS_VARIANT: Record<
  AdminProduct["status"],
  "default" | "secondary" | "outline" | "destructive"
> = {
  active: "default",
  draft: "secondary",
  paused: "outline",
  archived: "destructive",
};

const CATEGORY_LABEL: Record<string, string> = {
  mtb: "MTB",
  road: "Ruta",
  urban: "Urbana",
  kids: "Niños",
  bmx: "BMX",
  parts: "Repuestos",
  accessories: "Accesorios",
  indumentaria: "Indumentaria",
};

const CONDITION_LABEL: Record<string, string> = {
  new: "Nuevo",
  used_like_new: "Como nuevo",
  used_good: "Buen estado",
  used_fair: "Aceptable",
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
  const parts = id.split("_");
  const raw = parts[parts.length - 1];
  return raw.slice(-8);
}

// ── Skeleton ──────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell>
            <Skeleton className="h-4 w-48 mb-1" />
            <Skeleton className="h-3 w-32" />
          </TableCell>
          <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

// ── Row ───────────────────────────────────────────────────────

function ProductRow({ product }: { product: AdminProduct }) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs text-muted-foreground">
        …{shortId(product.id)}
      </TableCell>
      <TableCell>
        <p className="font-medium leading-tight">{product.title}</p>
        <p className="text-xs text-muted-foreground">
          {product.brand} · {product.model}
        </p>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">
          {CATEGORY_LABEL[product.category] ?? product.category}
        </Badge>
      </TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {formatPrice(product.price_cents, product.currency)}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {CONDITION_LABEL[product.condition] ?? product.condition}
      </TableCell>
      <TableCell>
        <Badge variant={STATUS_VARIANT[product.status]}>
          {STATUS_LABEL[product.status]}
        </Badge>
      </TableCell>
      <TableCell className="text-sm">{product.seller_display_name}</TableCell>
      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
        {new Date(product.created_at).toLocaleDateString("es-AR")}
      </TableCell>
    </TableRow>
  );
}

// ── Main component ────────────────────────────────────────────

export function AdminProductsList() {
  const [status, setStatus] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useAdminProducts({
    status: status || undefined,
    category: category || undefined,
    page,
  });

  function handleStatusChange(val: string | null) {
    setStatus(!val || val === "all" ? "" : val);
    setPage(1);
  }

  function handleCategoryChange(val: string | null) {
    setCategory(!val || val === "all" ? "" : val);
    setPage(1);
  }

  const products = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={status || "all"} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="draft">Borrador</SelectItem>
            <SelectItem value="paused">Pausado</SelectItem>
            <SelectItem value="archived">Archivado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={category || "all"} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            <SelectItem value="mtb">MTB</SelectItem>
            <SelectItem value="road">Ruta</SelectItem>
            <SelectItem value="urban">Urbana</SelectItem>
            <SelectItem value="kids">Niños</SelectItem>
            <SelectItem value="bmx">BMX</SelectItem>
            <SelectItem value="parts">Repuestos</SelectItem>
            <SelectItem value="accessories">Accesorios</SelectItem>
            <SelectItem value="indumentaria">Indumentaria</SelectItem>
          </SelectContent>
        </Select>

        {pagination && (
          <span className="ml-auto text-xs text-muted-foreground">
            {pagination.total} producto{pagination.total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Table */}
      {error ? (
        <p className="text-sm text-destructive">Error al cargar los productos.</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">ID</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead>Condición</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Alta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <SkeletonRows />
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    No hay productos con los filtros seleccionados.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p) => <ProductRow key={p.id} product={p} />)
              )}
            </TableBody>
          </Table>

          {/* Footer */}
          {pagination && (
            <div className="flex items-center justify-between border-t px-4 py-2">
              <p className="text-xs text-muted-foreground">
                Página {pagination.page} · mostrando {products.length} de {pagination.total}
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
