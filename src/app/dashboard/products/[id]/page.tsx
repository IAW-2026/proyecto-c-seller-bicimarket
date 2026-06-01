"use client";

import { use, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import {
  useProduct,
  useAddProductImage,
  useDeleteProductImage,
  usePatchProduct,
  useArchiveProduct,
} from "@/hooks/use-seller-products";
import type { Product } from "@/hooks/use-seller-products";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCents } from "@/lib/format";

// ── Maps ─────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<Product["category"], string> = {
  mtb: "MTB",
  road: "Ruta",
  urban: "Urbana",
  kids: "Niños",
  bmx: "BMX",
  parts: "Repuestos",
  accessories: "Accesorios",
  indumentaria: "Indumentaria",
};

const CONDITION_LABELS: Record<Product["condition"], string> = {
  new: "Nuevo",
  used_like_new: "Como nuevo",
  used_good: "Buen estado",
  used_fair: "Estado regular",
};

const STATUS_VARIANT: Record<Product["status"], "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  draft: "secondary",
  paused: "outline",
  archived: "destructive",
};

const STATUS_LABELS: Record<Product["status"], string> = {
  active: "Activo",
  draft: "Borrador",
  paused: "Pausado",
  archived: "Archivado",
};

// ── Add image dialog ─────────────────────────────────────────

function AddImageDialog({
  productId,
  open,
  onOpenChange,
}: {
  productId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const add = useAddProductImage();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  function handleClose() {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
    onOpenChange(false);
  }

  async function handleAdd() {
    if (!file) return;
    try {
      await add.mutateAsync({ productId, file });
      toast.success("Imagen subida");
      handleClose();
    } catch {
      toast.error("No se pudo subir la imagen");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar imagen</DialogTitle>
          <DialogDescription>Seleccioná un archivo (JPEG, PNG, WebP o GIF · máx. 5 MB).</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="cursor-pointer"
            onChange={handleFileChange}
          />
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Vista previa" className="max-h-48 w-full rounded-md border object-contain" />
          )}
          {file && (
            <p className="text-xs text-muted-foreground">
              {file.name} · {(file.size / 1024).toFixed(0)} KB
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button disabled={!file || add.isPending} onClick={handleAdd}>
            {add.isPending ? "Subiendo…" : "Subir imagen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: product, isLoading, error } = useProduct(id);
  const [addImageOpen, setAddImageOpen] = useState(false);
  const patch = usePatchProduct();
  const archive = useArchiveProduct();
  const deleteImage = useDeleteProductImage();
  const busy = patch.isPending || archive.isPending;

  async function handleStatus(status: Product["status"]) {
    try {
      await patch.mutateAsync({ id, data: { status } });
      toast.success(`Producto ${STATUS_LABELS[status].toLowerCase()}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message ?? "No se pudo actualizar el producto");
    }
  }

  async function handleArchive() {
    try {
      await archive.mutateAsync(id);
      toast.success("Producto archivado");
      router.push("/dashboard/products");
    } catch {
      toast.error("No se pudo archivar el producto");
    }
  }

  async function handleDeleteImage(imageId: string) {
    try {
      await deleteImage.mutateAsync({ productId: id, imageId });
      toast.success("Imagen eliminada");
    } catch {
      toast.error("No se pudo eliminar la imagen");
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

  if (error || !product) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/products" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-4" /> Volver a productos
        </Link>
        <p className="text-sm text-destructive">Producto no encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Breadcrumb */}
      <Link
        href="/dashboard/products"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Volver a productos
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold leading-tight">{product.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {product.brand} · {product.model} · {CATEGORY_LABELS[product.category as Product["category"]]}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[product.status as Product["status"]]}>
          {STATUS_LABELS[product.status as Product["status"]]}
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={() => setAddImageOpen(true)}>
          + Imagen
        </Button>
        {product.status === "draft" && (
          <Button size="sm" disabled={busy} onClick={() => handleStatus("active")}>
            Activar
          </Button>
        )}
        {product.status === "active" && (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => handleStatus("paused")}>
            Pausar
          </Button>
        )}
        {product.status === "paused" && (
          <Button size="sm" disabled={busy} onClick={() => handleStatus("active")}>
            Reactivar
          </Button>
        )}
        {product.status !== "archived" && (
          <Button size="sm" variant="destructive" disabled={busy} onClick={handleArchive}>
            Archivar
          </Button>
        )}
      </div>

      {/* Info cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Precio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCents(product.price_cents, product.currency)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Condición</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base font-medium">{CONDITION_LABELS[product.condition as Product["condition"]]}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Peso</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base font-medium">{product.weight_grams > 0 ? `${product.weight_grams} g` : "—"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dimensiones</CardTitle>
          </CardHeader>
          <CardContent>
            {product.dimensions_cm ? (
              <p className="text-base font-medium">
                {product.dimensions_cm.length} × {product.dimensions_cm.width} × {product.dimensions_cm.height} cm
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No especificadas</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {product.description && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Descripción</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{product.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Images */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Imágenes ({product.images.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {product.images.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin imágenes. Agregá al menos una para activar el producto.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {product.images.map((img) => (
                <div key={img.id} className="group relative rounded-md overflow-hidden border aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <button
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium"
                    onClick={() => handleDeleteImage(img.id)}
                    disabled={deleteImage.isPending}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <p className="text-xs text-muted-foreground">
        Creado el {new Date(product.created_at).toLocaleDateString("es-AR")} · ID: <span className="font-mono">{product.id}</span>
      </p>

      <AddImageDialog productId={id} open={addImageOpen} onOpenChange={setAddImageOpen} />
    </div>
  );
}
