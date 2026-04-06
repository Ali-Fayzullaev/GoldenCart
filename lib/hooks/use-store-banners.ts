import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { StoreBanner } from "@/lib/types/database";

const supabase = createClient();

export function useStoreBanners(storeId: string | undefined) {
  return useQuery({
    queryKey: ["store-banners", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_banners")
        .select("*")
        .eq("store_id", storeId!)
        .order("sort_order");

      if (error) throw error;
      return data as unknown as StoreBanner[];
    },
    enabled: !!storeId,
  });
}

export function usePublicStoreBanners(storeId: string | undefined) {
  return useQuery({
    queryKey: ["public-store-banners", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_banners")
        .select("*")
        .eq("store_id", storeId!)
        .eq("is_active", true)
        .order("sort_order");

      if (error) throw error;
      return data as unknown as StoreBanner[];
    },
    enabled: !!storeId,
  });
}

export function useCreateStoreBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      store_id: string;
      image_url: string;
      link?: string;
      title?: string;
      sort_order?: number;
    }) => {
      const { data, error } = await supabase
        .from("store_banners")
        .insert(input as never)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as StoreBanner;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-banners"] });
    },
  });
}

export function useUpdateStoreBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StoreBanner> & { id: string }) => {
      const { data, error } = await supabase
        .from("store_banners")
        .update(updates as never)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as StoreBanner;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-banners"] });
      queryClient.invalidateQueries({ queryKey: ["public-store-banners"] });
    },
  });
}

export function useDeleteStoreBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("store_banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-banners"] });
      queryClient.invalidateQueries({ queryKey: ["public-store-banners"] });
    },
  });
}
