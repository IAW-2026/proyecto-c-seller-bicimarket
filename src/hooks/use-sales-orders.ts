"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export type SalesOrderItem = {
  id: string;
  product_id: string;
  product_name_snapshot: string;
  unit_price_cents: number;
  quantity: number;
};

export type SalesOrder = {
  id: string;
  order_id: string;
  seller_profile_id: string;
  buyer_profile_id: string;
  fulfillment_status:
    | "pending"
    | "accepted"
    | "rejected"
    | "preparing"
    | "ready_to_ship"
    | "handed_over"
    | "delivered"
    | "cancelled";
  shipping_status: string;
  payment_status: "pending" | "paid" | "refunded" | "settled";
  shipment_id: string | null;
  items_subtotal_cents: number;
  shipping_cost_cents: number;
  total_cents: number;
  currency: string;
  shipping_address_snapshot: Record<string, string>;
  items: SalesOrderItem[];
  created_at: string;
};

type PaginatedOrders = {
  data: SalesOrder[];
  pagination: { total: number; page: number; limit: number; has_more: boolean };
};

export function useSalesOrders(status?: string) {
  return useQuery<PaginatedOrders>({
    queryKey: ["sales-orders", status],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (status) params.set("status", status);
      const res = await api.get(`/v1/sales-orders?${params}`);
      return res.data as PaginatedOrders;
    },
  });
}

export function useSalesOrder(id: string) {
  return useQuery<SalesOrder>({
    queryKey: ["sales-order", id],
    queryFn: async () => {
      const res = await api.get(`/v1/sales-orders/${id}`);
      return res.data as SalesOrder;
    },
    enabled: !!id,
  });
}

export function useAcceptOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (salesOrderId: string) => api.post(`/v1/sales-orders/${salesOrderId}/accept`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales-orders"] }),
  });
}

export function useRejectOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ salesOrderId, reason }: { salesOrderId: string; reason: string }) =>
      api.post(`/v1/sales-orders/${salesOrderId}/reject`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales-orders"] }),
  });
}

export function usePrepareOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      salesOrderId,
      fulfillment_status,
    }: {
      salesOrderId: string;
      fulfillment_status: "preparing" | "ready_to_ship";
    }) => api.patch(`/v1/sales-orders/${salesOrderId}/prepare`, { fulfillment_status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales-orders"] }),
  });
}
