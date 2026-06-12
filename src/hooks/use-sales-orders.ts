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

// ── Optimistic helpers ───────────────────────────────────────

type FulfillmentStatus = SalesOrder["fulfillment_status"];

/**
 * Optimistically patches the fulfillment_status of one order across every
 * cached query (the list variants + the detail), returning a rollback fn.
 */
function optimisticPatchStatus(
  qc: ReturnType<typeof useQueryClient>,
  salesOrderId: string,
  nextStatus: FulfillmentStatus
) {
  const listSnapshots = qc.getQueriesData<PaginatedOrders>({ queryKey: ["sales-orders"] });
  const detailSnapshot = qc.getQueryData<SalesOrder>(["sales-order", salesOrderId]);

  qc.setQueriesData<PaginatedOrders>({ queryKey: ["sales-orders"] }, (old) =>
    old
      ? {
          ...old,
          data: old.data.map((o) =>
            o.id === salesOrderId ? { ...o, fulfillment_status: nextStatus } : o
          ),
        }
      : old
  );

  qc.setQueryData<SalesOrder>(["sales-order", salesOrderId], (old) =>
    old ? { ...old, fulfillment_status: nextStatus } : old
  );

  return () => {
    for (const [key, data] of listSnapshots) qc.setQueryData(key, data);
    if (detailSnapshot) qc.setQueryData(["sales-order", salesOrderId], detailSnapshot);
  };
}

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
    onMutate: async (salesOrderId) => {
      await qc.cancelQueries({ queryKey: ["sales-orders"] });
      await qc.cancelQueries({ queryKey: ["sales-order", salesOrderId] });
      return { rollback: optimisticPatchStatus(qc, salesOrderId, "accepted") };
    },
    onError: (_e, _vars, ctx) => ctx?.rollback(),
    onSettled: (_d, _e, salesOrderId) => {
      qc.invalidateQueries({ queryKey: ["sales-orders"] });
      qc.invalidateQueries({ queryKey: ["sales-order", salesOrderId] });
    },
  });
}

export function useRejectOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ salesOrderId, reason }: { salesOrderId: string; reason: string }) =>
      api.post(`/v1/sales-orders/${salesOrderId}/reject`, { reason }),
    onMutate: async ({ salesOrderId }) => {
      await qc.cancelQueries({ queryKey: ["sales-orders"] });
      await qc.cancelQueries({ queryKey: ["sales-order", salesOrderId] });
      return { rollback: optimisticPatchStatus(qc, salesOrderId, "rejected") };
    },
    onError: (_e, _vars, ctx) => ctx?.rollback(),
    onSettled: (_d, _e, { salesOrderId }) => {
      qc.invalidateQueries({ queryKey: ["sales-orders"] });
      qc.invalidateQueries({ queryKey: ["sales-order", salesOrderId] });
    },
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
    onMutate: async ({ salesOrderId, fulfillment_status }) => {
      await qc.cancelQueries({ queryKey: ["sales-orders"] });
      await qc.cancelQueries({ queryKey: ["sales-order", salesOrderId] });
      return { rollback: optimisticPatchStatus(qc, salesOrderId, fulfillment_status) };
    },
    onError: (_e, _vars, ctx) => ctx?.rollback(),
    onSettled: (_d, _e, { salesOrderId }) => {
      qc.invalidateQueries({ queryKey: ["sales-orders"] });
      qc.invalidateQueries({ queryKey: ["sales-order", salesOrderId] });
    },
  });
}
