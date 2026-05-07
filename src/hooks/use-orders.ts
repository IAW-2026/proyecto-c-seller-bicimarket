"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export type OrderItem = {
  id: string;
  product_id: string;
  product_name_snapshot: string;
  unit_price_cents: number;
  quantity: number;
};

export type SalesOrder = {
  id: string;
  order_id: string;
  fulfillment_status:
    | "pending"
    | "accepted"
    | "preparing"
    | "ready_to_ship"
    | "handed_over"
    | "delivered"
    | "rejected"
    | "cancelled";
  shipping_status: string | null;
  payment_status: string;
  items_subtotal_cents: number;
  shipping_cost_cents: number;
  total_cents: number;
  currency: string;
  shipping_address_snapshot: Record<string, string>;
  items: OrderItem[];
  created_at: string;
};

const ACTIVE_STATUSES = ["pending", "accepted", "preparing", "ready_to_ship", "handed_over"];
const HISTORY_STATUSES = ["delivered", "rejected", "cancelled"];

export function useSalesOrders() {
  return useQuery({
    queryKey: ["sales-orders"],
    queryFn: async () => {
      const { data } = await api.get<{ data: SalesOrder[] }>("/v1/sales-orders", {
        params: { limit: 100 },
      });
      return data.data ?? [];
    },
  });
}

export function useActiveOrders() {
  const { data: all, ...rest } = useSalesOrders();
  return {
    ...rest,
    data: all?.filter((o) => ACTIVE_STATUSES.includes(o.fulfillment_status)) ?? [],
  };
}

export function useHistoryOrders() {
  const { data: all, ...rest } = useSalesOrders();
  return {
    ...rest,
    data: all?.filter((o) => HISTORY_STATUSES.includes(o.fulfillment_status)) ?? [],
  };
}

export function useAcceptOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      api.post(`/v1/sales-orders/${orderId}/accept`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales-orders"] }),
  });
}

export function useRejectOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) =>
      api.post(`/v1/sales-orders/${orderId}/reject`, { reason }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales-orders"] }),
  });
}

export function useAdvanceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      api
        .patch(`/v1/sales-orders/${orderId}/prepare`, { fulfillment_status: status })
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales-orders"] }),
  });
}
