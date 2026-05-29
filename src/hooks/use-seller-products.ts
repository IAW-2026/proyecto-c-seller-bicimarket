"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export type ProductImage = { id: string; url: string; position: number };

export type Product = {
  id: string;
  seller_profile_id: string;
  title: string;
  description: string;
  brand: string;
  model: string;
  category: "mtb" | "road" | "urban" | "kids" | "bmx" | "parts" | "accessories";
  condition: "new" | "used_like_new" | "used_good" | "used_fair";
  price_cents: number;
  currency: string;
  weight_grams: number;
  dimensions_cm: { length: number; width: number; height: number } | null;
  status: "draft" | "active" | "paused" | "archived";
  images: ProductImage[];
  created_at: string;
};

export type CreateProductInput = {
  title: string;
  description: string;
  brand: string;
  model: string;
  category: Product["category"];
  condition: Product["condition"];
  price_cents: number;
  weight_grams: number;
  dimensions_cm?: { length: number; width: number; height: number };
};

export type PatchProductInput = Partial<CreateProductInput> & {
  status?: Product["status"];
};

type PaginatedProducts = {
  data: Product[];
  pagination: { total: number };
};

export function useMyProducts() {
  return useQuery<PaginatedProducts>({
    queryKey: ["my-products"],
    queryFn: async () => {
      const res = await api.get("/v1/seller-profile/me/products?limit=100");
      return res.data as PaginatedProducts;
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductInput) => api.post("/v1/products", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-products"] }),
  });
}

export function usePatchProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PatchProductInput }) =>
      api.patch(`/v1/products/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-products"] }),
  });
}

export function useArchiveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/v1/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-products"] }),
  });
}

export function useAddProductImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, file }: { productId: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      // Do NOT set Content-Type manually — Axios sets multipart + boundary automatically
      return api.post(`/v1/products/${productId}/images`, formData, {
        headers: { "Content-Type": undefined },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-products"] }),
  });
}

export function useDeleteProductImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, imageId }: { productId: string; imageId: string }) =>
      api.delete(`/v1/products/${productId}/images/${imageId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-products"] }),
  });
}
