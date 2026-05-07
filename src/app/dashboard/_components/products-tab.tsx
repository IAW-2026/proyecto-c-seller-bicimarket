"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bike, Lock } from "lucide-react";
import {
  useMyProducts,
  useCreateProduct,
  usePatchProduct,
  useArchiveProduct,
  useAddProductImage,
  useDeleteProductImage,
  type Product,
  type CreateProductInput,
} from "@/hooks/use-seller-products";
import { useSellerProfile } from "@/hooks/use-seller-profile";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatCents } from "@/lib/format";

// ── Constants ────────────────────────────────────────────────

const CATEGORY_LABELS: Record<Product["category"], string> = {
  mtb: "MTB",
  road: "Ruta",
  urban: "Urbana",
  kids: "Niños",
  bmx: "BMX",
  parts: "Repuestos",
  accessories: "Accesorios",
};

const CONDITION_LABELS: Record<Product["condition"], string> = {
  new: "Nuevo",
  used_like_new: "Usado — como nuevo",
  used_good: "Usado — buen estado",
  used_fair: "Usado — estado regular",
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

// ── Create product form ──────────────────────────────────────

const EMPTY_FORM: CreateProductInput = {
  title: "",
  description: "",
  brand: "",
  model: "",
  category: "mtb",
  condition: "new",
  price_cents: 0,
  weight_grams: 0,
};

function CreateProductDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [form, setForm] = useState<CreateProductInput>(EMPTY_FORM);
  const create = useCreateProduct();

  function set<K extends keyof CreateProductInput>(k: K, v: CreateProductInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit() {
    if (!form.title || !form.brand || !form.model || form.price_cents <= 0) {
      toast.error("Completá los campos obligatorios");
      return;
    }
    try {
      await create.mutateAsync(form);
      toast.success("Producto creado en borrador");
      setForm(EMPTY_FORM);
      onOpenChange(false);
    } catch {
      toast.error("No se pudo crear el producto");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo producto</DialogTitle>
          <DialogDescription>
            Se crea como borrador. Para activarlo necesitás al menos una imagen y datos completos.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Marca *</Label>
              <Input value={form.brand} onChange={(e) => set("brand", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Modelo *</Label>
              <Input value={form.model} onChange={(e) => set("model", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Precio (ARS) *</Label>
              <Input
                type="number"
                min={0}
                value={form.price_cents / 100 || ""}
                onChange={(e) => set("price_cents", Math.round(parseFloat(e.target.value || "0") * 100))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Categoría</Label>
              <Select
                value={form.category}
                onValueChange={(v) => set("category", v as Product["category"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(CATEGORY_LABELS) as [Product["category"], string][]).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Condición</Label>
              <Select
                value={form.condition}
                onValueChange={(v) => set("condition", v as Product["condition"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(CONDITION_LABELS) as [Product["condition"], string][]).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Peso (gramos) *</Label>
            <Input
              type="number"
              min={0}
              value={form.weight_grams || ""}
              onChange={(e) => set("weight_grams", parseInt(e.target.value || "0", 10))}
            />
          </div>

          <div className="space-y-1">
            <Label>Descripción</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={create.isPending} onClick={handleSubmit}>Crear producto</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
  const [url, setUrl] = useState("");
  const add = useAddProductImage();

  async function handleAdd() {
    if (!url.trim()) return;
    try {
      await add.mutateAsync({ productId, url: url.trim() });
      toast.success("Imagen agregada");
      setUrl("");
      onOpenChange(false);
    } catch {
      toast.error("No se pudo agregar la imagen");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar imagen</DialogTitle>
          <DialogDescription>Ingresá la URL pública de la imagen.</DialogDescription>
        </DialogHeader>
        <Input
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={add.isPending} onClick={handleAdd}>Agregar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Product card ─────────────────────────────────────────────

function ProductCard({ product }: { product: Product }) {
  const [addImageOpen, setAddImageOpen] = useState(false);
  const patch = usePatchProduct();
  const archive = useArchiveProduct();
  const deleteImage = useDeleteProductImage();

  const busy = patch.isPending || archive.isPending || deleteImage.isPending;

  async function handleStatus(status: Product["status"]) {
    try {
      await patch.mutateAsync({ id: product.id, data: { status } });
      toast.success(`Producto ${STATUS_LABELS[status].toLowerCase()}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message ?? "No se pudo actualizar el producto");
    }
  }

  async function handleArchive() {
    try {
      await archive.mutateAsync(product.id);
      toast.success("Producto archivado");
    } catch {
      toast.error("No se pudo archivar el producto");
    }
  }

  async function handleDeleteImage(imageId: string) {
    try {
      await deleteImage.mutateAsync({ productId: product.id, imageId });
      toast.success("Imagen eliminada");
    } catch {
      toast.error("No se pudo eliminar la imagen");
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate text-sm">{product.title}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {product.brand} · {product.model} · {CATEGORY_LABELS[product.category]}
            </p>
          </div>
          <Badge variant={STATUS_VARIANT[product.status]}>{STATUS_LABELS[product.status]}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{CONDITION_LABELS[product.condition]}</span>
          <span className="font-semibold">{formatCents(product.price_cents)}</span>
        </div>

        {/* Images */}
        {product.images.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {product.images.map((img) => (
              <div key={img.id} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt=""
                  className="h-16 w-16 rounded object-cover border"
                />
                <button
                  onClick={() => handleDeleteImage(img.id)}
                  disabled={busy}
                  className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100 rounded transition-opacity"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}

        <Separator />

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => setAddImageOpen(true)}
          >
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
      </CardContent>

      <AddImageDialog
        productId={product.id}
        open={addImageOpen}
        onOpenChange={setAddImageOpen}
      />
    </Card>
  );
}

// ── Tab ──────────────────────────────────────────────────────

export function ProductsTab() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading, error } = useMyProducts();
  const { data: profile } = useSellerProfile();
  const isVerified = profile?.verification_status === "verified";

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando productos…</p>;
  if (error) return <p className="text-sm text-destructive">Error al cargar productos</p>;

  const products = data?.data ?? [];
  const active = products.filter((p) => p.status !== "archived");
  const archived = products.filter((p) => p.status === "archived");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-base font-semibold">
          Catálogo ({active.length})
        </h3>
        {isVerified ? (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            + Nuevo producto
          </Button>
        ) : (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3" />
            Verificá tu perfil para publicar productos
          </p>
        )}
      </div>

      {active.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <Bike className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {isVerified
              ? "No tenés productos. Creá el primero."
              : "Verificá tu perfil para empezar a publicar."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {active.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <section>
          <h3 className="mb-3 font-heading text-base font-semibold text-muted-foreground">
            Archivados
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {archived.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <CreateProductDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
