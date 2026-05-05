"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export type Settlement = {
  id: string;
  order_id: string;
  seller_profile_id: string;
  gross_amount_cents: number;
  fee_amount_cents: number;
  net_amount_cents: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "manual_review";
  paid_at: string | null;
  created_at: string;
};

type PaginatedSettlements = {
  data: Settlement[];
  pagination: { total: number; page: number; limit: number; has_more: boolean };
};

export function useSettlements(params?: { status?: string; from?: string; to?: string }) {
  return useQuery<PaginatedSettlements>({
    queryKey: ["settlements", params],
    queryFn: async () => {
      const search = new URLSearchParams({ limit: "20" });
      if (params?.status) search.set("status", params.status);
      if (params?.from) search.set("from", params.from);
      if (params?.to) search.set("to", params.to);
      const res = await api.get(`/v1/settlements?${search}`);
      return res.data as PaginatedSettlements;
    },
  });
}
