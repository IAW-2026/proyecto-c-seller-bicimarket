"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export type AdminSellerProfile = {
  id: string;
  clerk_user_id: string;
  legal_name: string;
  display_name: string;
  tax_id: string;
  tax_condition: string;
  bank_account_reference: string;
  pickup_address: Record<string, string>;
  verification_status: "pending_review" | "verified" | "suspended";
  created_at: string;
};

type PaginatedProfiles = {
  data: AdminSellerProfile[];
  pagination: { total: number; page: number; limit: number; has_more: boolean };
};

export function useAdminSellers() {
  return useQuery<PaginatedProfiles>({
    queryKey: ["admin-sellers"],
    queryFn: async () => {
      const res = await api.get("/v1/admin/seller-profiles?limit=100");
      return res.data as PaginatedProfiles;
    },
  });
}

export function useAdminVerify() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "verified" | "pending_review" | "suspended";
    }) => api.patch(`/v1/admin/seller-profiles/${id}/verification`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-sellers"] }),
  });
}
