"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export type AdminProduct = {
  id: string;
  title: string;
  brand: string;
  model: string;
  category: string;
  condition: string;
  price_cents: number;
  currency: string;
  weight_grams: number;
  status: "draft" | "active" | "paused" | "archived";
  seller_display_name: string;
  seller_profile_id: string;
  created_at: string;
};

type PaginatedProducts = {
  data: AdminProduct[];
  pagination: { total: number; page: number; limit: number; has_more: boolean };
};

type Filters = {
  status?: string;
  category?: string;
  page?: number;
};

export function useAdminProducts(filters: Filters = {}) {
  const params = new URLSearchParams({ limit: "50" });
  if (filters.status) params.set("status", filters.status);
  if (filters.category) params.set("category", filters.category);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));

  return useQuery<PaginatedProducts>({
    queryKey: ["admin-products", filters],
    queryFn: async () => {
      const res = await api.get(`/v1/admin/products?${params}`);
      return res.data as PaginatedProducts;
    },
  });
}
