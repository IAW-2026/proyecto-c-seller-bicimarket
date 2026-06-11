"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export type AdminSalesOrder = {
  id: string;
  order_id: string;
  seller_profile_id: string;
  seller_display_name: string;
  buyer_profile_id: string;
  fulfillment_status: string;
  payment_status: string;
  shipping_status: string;
  items_count: number;
  total_cents: number;
  currency: string;
  created_at: string;
};

type PaginatedOrders = {
  data: AdminSalesOrder[];
  pagination: { total: number; page: number; limit: number; has_more: boolean };
};

type Filters = {
  fulfillment_status?: string;
  payment_status?: string;
  page?: number;
};

export function useAdminSalesOrders(filters: Filters = {}) {
  const params = new URLSearchParams({ limit: "20" });
  if (filters.fulfillment_status) params.set("fulfillment_status", filters.fulfillment_status);
  if (filters.payment_status) params.set("payment_status", filters.payment_status);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));

  return useQuery<PaginatedOrders>({
    queryKey: ["admin-sales-orders", filters],
    queryFn: async () => {
      const res = await api.get(`/v1/admin/sales-orders?${params}`);
      return res.data as PaginatedOrders;
    },
  });
}
