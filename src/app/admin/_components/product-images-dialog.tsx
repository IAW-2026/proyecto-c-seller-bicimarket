"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  useAdminProductImages,
  useAdminAddProductImage,
  useAdminDeleteProductImage,
} from "@/hooks/use-admin-product-images";
import { Button } from "@/components/ui/button";
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

export function ProductImagesDialog({
  productId,
  productTitle,
  open,
  onOpenChange,
}: {
  productId: string | null;
  productTitle: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data, isLoading, error } = useAdminProductImages(open ? productId : null);
  const add = useAdminAddProductImage();
  const del = useAdminDeleteProductImage();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const images = data?.data ?? [];

  function resetFile() {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  function handleClose(v: boolean) {
    if (!v) resetFile();
    onOpenChange(v);
  }

  async function handleAdd() {
    if (!file || !productId) return;
    try {
      await add.mutateAsync({ productId, file });
      toast.success("Imagen subida");
      resetFile();
    } catch {
      toast.error("No se pudo subir la imagen");
    }
  }

  async function handleDelete(imageId: string) {
    if (!productId) return;
    try {
      await del.mutateAsync({ productId, imageId });
      toast.success("Imagen eliminada");
    } catch {
      toast.error("No se pudo eliminar la imagen");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Imágenes del producto</DialogTitle>
          <DialogDescription className="truncate">{productTitle}</DialogDescription>
        </DialogHeader>

        {/* Current images */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Imágenes actuales ({images.length})
          </p>
          {error ? (
            <p className="text-sm text-destructive">No se pudieron cargar las imágenes.</p>
          ) : isLoading ? (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-md" />
              ))}
            </div>
          ) : images.length === 0 ? (
            <p className="text-sm text-muted-foreground">Este producto no tiene imágenes.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group relative aspect-square overflow-hidden rounded-md border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                  <button
                    className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:cursor-not-allowed"
                    onClick={() => handleDelete(img.id)}
                    disabled={del.isPending}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload new */}
        <div className="space-y-2 border-t pt-4">
          <p className="text-sm font-medium text-muted-foreground">Agregar imagen</p>
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
          <p className="text-xs text-muted-foreground">JPEG, PNG, WebP o GIF · máx. 5 MB</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cerrar
          </Button>
          <Button disabled={!file || add.isPending} onClick={handleAdd}>
            {add.isPending ? "Subiendo…" : "Subir imagen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
