"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export type AdminProductImage = {
  id: string;
  product_id: string;
  url: string;
  position: number;
};

type ImagesResponse = { data: AdminProductImage[] };

export function useAdminProductImages(productId: string | null) {
  return useQuery<ImagesResponse>({
    queryKey: ["admin-product-images", productId],
    queryFn: async () => {
      const res = await api.get(`/v1/admin/products/${productId}/images`);
      return res.data as ImagesResponse;
    },
    enabled: !!productId,
  });
}

export function useAdminAddProductImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, file }: { productId: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      // Do NOT set Content-Type manually — Axios sets multipart + boundary automatically
      return api.post(`/v1/admin/products/${productId}/images`, formData, {
        headers: { "Content-Type": undefined },
      });
    },
    onSuccess: (_d, { productId }) => {
      qc.invalidateQueries({ queryKey: ["admin-product-images", productId] });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });
}

export function useAdminDeleteProductImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, imageId }: { productId: string; imageId: string }) =>
      api.delete(`/v1/admin/products/${productId}/images/${imageId}`),
    onSuccess: (_d, { productId }) => {
      qc.invalidateQueries({ queryKey: ["admin-product-images", productId] });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });
}
