"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Bike,
  Lock,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Zap,
  FileEdit,
  PauseCircle,
  Archive,
} from "lucide-react";
import {
  useMyProducts,
  useCreateProduct,
  usePatchProduct,
  useArchiveProduct,
  useAddProductImage,
  type Product,
  type CreateProductInput,
} from "@/hooks/use-seller-products";
import { useSellerProfile } from "@/hooks/use-seller-profile";
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
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { formatCents } from "@/lib/format";

// ── Types ────────────────────────────────────────────────────

type ProductSortKey = "title" | "price";
type SortDir = "asc" | "desc";

// ── Constants ────────────────────────────────────────────────

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

// ── Sort icon helper ─────────────────────────────────────────

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="size-3 opacity-40" />;
  return dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />;
}

// ── Create product dialog ────────────────────────────────────

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const create = useCreateProduct();
  const addImage = useAddProductImage();
  const busy = create.isPending || addImage.isPending;

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  function set<K extends keyof CreateProductInput>(k: K, v: CreateProductInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function setDim(key: "length" | "width" | "height", v: number) {
    setForm((f) => ({
      ...f,
      dimensions_cm: {
        length: f.dimensions_cm?.length ?? 0,
        width: f.dimensions_cm?.width ?? 0,
        height: f.dimensions_cm?.height ?? 0,
        [key]: v,
      },
    }));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(f);
    setImagePreview(f ? URL.createObjectURL(f) : null);
  }

  function handleClose() {
    setForm(EMPTY_FORM);
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    onOpenChange(false);
  }

  async function handleSubmit() {
    if (!form.title || !form.brand || !form.model || form.price_cents <= 0) {
      toast.error("Completá los campos obligatorios");
      return;
    }
    const dim = form.dimensions_cm;
    const payload: CreateProductInput = {
      ...form,
      dimensions_cm:
        dim && dim.length > 0 && dim.width > 0 && dim.height > 0 ? dim : undefined,
    };
    try {
      const res = await create.mutateAsync(payload);
      if (imageFile) {
        try {
          await addImage.mutateAsync({ productId: res.data.id, file: imageFile });
        } catch {
          toast.error("Producto creado, pero no se pudo subir la imagen");
          handleClose();
          return;
        }
      }
      toast.success("Producto creado en borrador");
      handleClose();
    } catch {
      toast.error("No se pudo crear el producto");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
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
              <Label htmlFor="product-title">Título *</Label>
              <Input id="product-title" value={form.title} onChange={(e) => set("title", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="product-brand">Marca *</Label>
              <Input id="product-brand" value={form.brand} onChange={(e) => set("brand", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="product-model">Modelo *</Label>
              <Input id="product-model" value={form.model} onChange={(e) => set("model", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="product-price">Precio (ARS) *</Label>
              <Input
                id="product-price"
                type="number"
                min={0}
                value={form.price_cents / 100 || ""}
                onChange={(e) => set("price_cents", Math.round(parseFloat(e.target.value || "0") * 100))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="product-category">Categoría</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v as Product["category"])}>
                <SelectTrigger id="product-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(CATEGORY_LABELS) as [Product["category"], string][]).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="product-condition">Condición</Label>
              <Select value={form.condition} onValueChange={(v) => set("condition", v as Product["condition"])}>
                <SelectTrigger id="product-condition"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(CONDITION_LABELS) as [Product["condition"], string][]).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="product-weight">Peso (gramos) *</Label>
            <Input
              id="product-weight"
              type="number"
              min={0}
              value={form.weight_grams || ""}
              onChange={(e) => set("weight_grams", parseInt(e.target.value || "0", 10))}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="product-length">Largo (cm)</Label>
              <Input
                id="product-length"
                type="number"
                min={0}
                value={form.dimensions_cm?.length || ""}
                onChange={(e) => setDim("length", parseInt(e.target.value || "0", 10))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="product-width">Ancho (cm)</Label>
              <Input
                id="product-width"
                type="number"
                min={0}
                value={form.dimensions_cm?.width || ""}
                onChange={(e) => setDim("width", parseInt(e.target.value || "0", 10))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="product-height">Alto (cm)</Label>
              <Input
                id="product-height"
                type="number"
                min={0}
                value={form.dimensions_cm?.height || ""}
                onChange={(e) => setDim("height", parseInt(e.target.value || "0", 10))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="product-description">Descripción</Label>
            <Textarea
              id="product-description"
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="product-image">Imagen</Label>
            <Input
              ref={imageInputRef}
              id="product-image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="cursor-pointer"
              onChange={handleImageChange}
            />
            {imagePreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagePreview}
                alt="Vista previa"
                className="mt-2 max-h-36 w-full rounded-md border object-contain"
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={busy}>
            Cancelar
          </Button>
          <Button disabled={busy} onClick={handleSubmit}>
            {busy ? "Creando…" : "Crear producto"}
          </Button>
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
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const add = useAddProductImage();

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  function handleClose() {
    setFile(null);
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
          <DialogDescription>
            Seleccioná un archivo (JPEG, PNG, WebP o GIF · máx. 5 MB).
          </DialogDescription>
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
            <img
              src={preview}
              alt="Vista previa"
              className="max-h-48 w-full rounded-md border object-contain"
            />
          )}
          {file && (
            <p className="text-xs text-muted-foreground">
              {file.name} · {(file.size / 1024).toFixed(0)} KB
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button disabled={!file || add.isPending} onClick={handleAdd}>
            {add.isPending ? "Subiendo…" : "Subir imagen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Product row ──────────────────────────────────────────────

function ProductRow({ product }: { product: Product }) {
  const [addImageOpen, setAddImageOpen] = useState(false);
  const patch = usePatchProduct();
  const archive = useArchiveProduct();
  const busy = patch.isPending || archive.isPending;

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

  return (
    <>
      <TableRow className="transition-colors">
        <TableCell>
          <p className="font-medium text-sm leading-tight">{product.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {product.brand} · {product.model} · {CATEGORY_LABELS[product.category]}
          </p>
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {CONDITION_LABELS[product.condition]}
        </TableCell>
        <TableCell className="text-right font-semibold text-sm">
          {formatCents(product.price_cents)}
        </TableCell>
        <TableCell>
          <Badge variant={STATUS_VARIANT[product.status]}>{STATUS_LABELS[product.status]}</Badge>
        </TableCell>
        <TableCell className="text-xs text-muted-foreground text-center">
          {product.images.length}
        </TableCell>
        <TableCell>
          <div className="flex gap-1.5 flex-wrap">
            <Link href={`/dashboard/products/${product.id}`}>
              <Button size="sm" variant="outline">
                Ver
              </Button>
            </Link>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => setAddImageOpen(true)}>
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
        </TableCell>
      </TableRow>

      <AddImageDialog productId={product.id} open={addImageOpen} onOpenChange={setAddImageOpen} />
    </>
  );
}

// ── Table header ─────────────────────────────────────────────

function ProductTableHeader({
  sortKey,
  sortDir,
  onSort,
}: {
  sortKey: ProductSortKey;
  sortDir: SortDir;
  onSort: (key: ProductSortKey) => void;
}) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>
          <button
            className="flex items-center gap-1 hover:text-foreground transition-colors"
            onClick={() => onSort("title")}
          >
            Producto
            <SortIndicator active={sortKey === "title"} dir={sortDir} />
          </button>
        </TableHead>
        <TableHead>Condición</TableHead>
        <TableHead className="text-right">
          <button
            className="flex items-center gap-1 hover:text-foreground transition-colors ml-auto"
            onClick={() => onSort("price")}
          >
            Precio
            <SortIndicator active={sortKey === "price"} dir={sortDir} />
          </button>
        </TableHead>
        <TableHead>Estado</TableHead>
        <TableHead className="text-center">Imgs</TableHead>
        <TableHead>Acciones</TableHead>
      </TableRow>
    </TableHeader>
  );
}

// ── Tab ──────────────────────────────────────────────────────

export function ProductsTab() {
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Product["status"]>("all");
  const [sortKey, setSortKey] = useState<ProductSortKey>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const { data, isLoading, error } = useMyProducts();
  const { data: profile } = useSellerProfile();
  const isVerified = profile?.verification_status === "verified";

  function toggleSort(key: ProductSortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando productos…</p>;

  if (error) {
    if (!profile) {
      return (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <Bike className="size-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium">Completá tu perfil de vendedor</p>
          <p className="text-xs text-muted-foreground">
            Necesitás crear tu perfil antes de poder publicar productos.
          </p>
        </div>
      );
    }
    return <p className="text-sm text-destructive">Error al cargar productos</p>;
  }

  const products = data?.data ?? [];
  const q = search.trim().toLowerCase();

  function filterAndSort(list: Product[]) {
    return list
      .filter((p) => {
        if (statusFilter !== "all" && p.status !== statusFilter) return false;
        if (q && !p.title.toLowerCase().includes(q) && !p.brand.toLowerCase().includes(q))
          return false;
        return true;
      })
      .sort((a, b) => {
        const cmp =
          sortKey === "price"
            ? a.price_cents - b.price_cents
            : a.title.localeCompare(b.title, "es");
        return sortDir === "asc" ? cmp : -cmp;
      });
  }

  const active = filterAndSort(products.filter((p) => p.status !== "archived"));
  const archived = filterAndSort(products.filter((p) => p.status === "archived"));
  const isFiltered = statusFilter !== "all" || q.length > 0;

  const stats = [
    {
      label: "Activos",
      value: products.filter((p) => p.status === "active").length,
      icon: Zap,
      color: "text-primary",
    },
    {
      label: "Borradores",
      value: products.filter((p) => p.status === "draft").length,
      icon: FileEdit,
      color: "text-warning",
    },
    {
      label: "Pausados",
      value: products.filter((p) => p.status === "paused").length,
      icon: PauseCircle,
      color: "text-muted-foreground",
    },
    {
      label: "Archivados",
      value: products.filter((p) => p.status === "archived").length,
      icon: Archive,
      color: "text-muted-foreground",
    },
  ];

  const tableHeaderProps = { sortKey, sortDir, onSort: toggleSort };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-base font-semibold">Catálogo</h3>
        {isVerified ? (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            + Nuevo producto
          </Button>
        ) : (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3" aria-hidden="true" />
            Verificá tu perfil para publicar productos
          </p>
        )}
      </div>

      {/* Stat boxes */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <s.icon className={`size-4 ${s.color}`} aria-hidden="true" />
              </div>
              <p className="font-mono text-2xl font-semibold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-8 h-8 text-sm"
            placeholder="Buscar por título o marca…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as "all" | Product["status"])}
        >
          <SelectTrigger className="h-8 w-44 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {(Object.entries(STATUS_LABELS) as [Product["status"], string][]).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active products table */}
      {active.length === 0 && archived.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <Bike className="size-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="text-sm text-muted-foreground">
            {isFiltered
              ? "Sin resultados para esa búsqueda."
              : isVerified
                ? "No tenés productos. Creá el primero."
                : "Verificá tu perfil para empezar a publicar."}
          </p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <Table>
              <ProductTableHeader {...tableHeaderProps} />
              <TableBody>
                {active.map((p) => (
                  <ProductRow key={p.id} product={p} />
                ))}
              </TableBody>
            </Table>
          )}

          {/* Archived products */}
          {archived.length > 0 && (
            <section className="space-y-3">
              <h3 className="font-heading text-sm font-semibold text-muted-foreground">
                Archivados
              </h3>
              <Table>
                <ProductTableHeader {...tableHeaderProps} />
                <TableBody>
                  {archived.map((p) => (
                    <ProductRow key={p.id} product={p} />
                  ))}
                </TableBody>
              </Table>
            </section>
          )}
        </>
      )}

      <CreateProductDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
