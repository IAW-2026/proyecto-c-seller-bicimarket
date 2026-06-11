import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export type PostalCode = {
  cp: string;
  lat: number;
  lng: number;
  city: string;
  province: string;
};

export function usePostalCodes() {
  return useQuery<PostalCode[]>({
    queryKey: ["postal-codes"],
    queryFn: async () => {
      const { data } = await api.get<{ data: PostalCode[] }>("/v1/postal-codes");
      return data.data;
    },
    staleTime: Infinity,
  });
}
