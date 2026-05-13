"use client";

import { toast } from "sonner";
import { useAdminSellers, useAdminVerify, type AdminSellerProfile } from "@/hooks/use-admin-sellers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const VERIFICATION_LABEL = {
  pending_review: "Pendiente",
  verified: "Verificado",
  suspended: "Suspendido",
};

const VERIFICATION_VARIANT: Record<
  AdminSellerProfile["verification_status"],
  "default" | "secondary" | "destructive"
> = {
  pending_review: "secondary",
  verified: "default",
  suspended: "destructive",
};

const TAX_LABEL: Record<string, string> = {
  monotributo: "Monotributo",
  responsable_inscripto: "Resp. inscripto",
  consumidor_final: "Cons. final",
};

function SellerRow({ profile }: { profile: AdminSellerProfile }) {
  const verify = useAdminVerify();
  const busy = verify.isPending;

  async function handle(status: AdminSellerProfile["verification_status"]) {
    try {
      await verify.mutateAsync({ id: profile.id, status });
      toast.success(`${profile.display_name} → ${VERIFICATION_LABEL[status]}`);
    } catch {
      toast.error("No se pudo actualizar el estado");
    }
  }

  return (
    <TableRow>
      <TableCell>
        <p className="font-medium">{profile.display_name}</p>
        <p className="text-xs text-muted-foreground">{profile.legal_name}</p>
      </TableCell>
      <TableCell className="font-mono text-sm">{profile.tax_id}</TableCell>
      <TableCell className="text-sm">{TAX_LABEL[profile.tax_condition] ?? profile.tax_condition}</TableCell>
      <TableCell>
        <Badge variant={VERIFICATION_VARIANT[profile.verification_status]}>
          {VERIFICATION_LABEL[profile.verification_status]}
        </Badge>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {new Date(profile.created_at).toLocaleDateString("es-AR")}
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          {profile.verification_status !== "verified" && (
            <Button size="sm" disabled={busy} onClick={() => handle("verified")}>
              Verificar
            </Button>
          )}
          {profile.verification_status !== "suspended" && (
            <Button
              size="sm"
              variant="destructive"
              disabled={busy}
              onClick={() => handle("suspended")}
            >
              Suspender
            </Button>
          )}
          {profile.verification_status === "suspended" && (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => handle("pending_review")}
            >
              Reactivar
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-8 w-24 rounded-md" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function SellersList() {
  const { data, isLoading, error } = useAdminSellers();

  if (error) return <p className="text-sm text-destructive">Error al cargar los vendedores.</p>;

  const profiles = data?.data ?? [];

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vendedor</TableHead>
            <TableHead>CUIT / CUIL</TableHead>
            <TableHead>Condición fiscal</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Registrado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <SkeletonRows />
          ) : profiles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                No hay vendedores registrados.
              </TableCell>
            </TableRow>
          ) : (
            profiles.map((p) => <SellerRow key={p.id} profile={p} />)
          )}
        </TableBody>
      </Table>
      {data && (
        <p className="px-4 py-2 text-xs text-muted-foreground border-t">
          {data.pagination.total} vendedor{data.pagination.total !== 1 ? "es" : ""} en total
        </p>
      )}
    </div>
  );
}
