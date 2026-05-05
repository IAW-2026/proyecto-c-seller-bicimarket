"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export type SellerProfile = {
  id: string;
  clerk_user_id: string;
  legal_name: string;
  display_name: string;
  tax_id: string;
  tax_condition: "monotributo" | "responsable_inscripto" | "consumidor_final";
  bank_account_reference: string;
  pickup_address: {
    street: string;
    number: string;
    city: string;
    province: string;
    postal_code: string;
    country: string;
  };
  verification_status: "pending_review" | "verified" | "suspended";
  created_at: string;
};

export type SellerProfileInput = Omit<SellerProfile, "id" | "clerk_user_id" | "verification_status" | "created_at">;

export function useSellerProfile() {
  return useQuery<SellerProfile | null>({
    queryKey: ["seller-profile"],
    queryFn: async () => {
      try {
        const res = await api.get("/v1/seller-profile/me");
        return res.data as SellerProfile;
      } catch (err: unknown) {
        const e = err as { response?: { status?: number } };
        if (e?.response?.status === 404) return null;
        throw err;
      }
    },
  });
}

export function useUpsertSellerProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SellerProfileInput) => api.put("/v1/seller-profile/me", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seller-profile"] }),
  });
}
