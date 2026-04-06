import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { StorePage } from "@/lib/types/database";

const supabase = createClient();

export function useStorePages(storeId: string | undefined) {
  return useQuery({
    queryKey: ["store-pages", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_pages")
        .select("*")
        .eq("store_id", storeId!)
        .order("sort_order");

      if (error) throw error;
      return data as unknown as StorePage[];
    },
    enabled: !!storeId,
  });
}

export function usePublicStorePages(storeId: string | undefined) {
  return useQuery({
    queryKey: ["public-store-pages", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_pages")
        .select("*")
        .eq("store_id", storeId!)
        .eq("is_published", true)
        .order("sort_order");

      if (error) throw error;
      return data as unknown as StorePage[];
    },
    enabled: !!storeId,
  });
}

export function useStorePage(storeId: string | undefined, pageSlug: string) {
  return useQuery({
    queryKey: ["store-page", storeId, pageSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_pages")
        .select("*")
        .eq("store_id", storeId!)
        .eq("slug", pageSlug)
        .eq("is_published", true)
        .single();

      if (error) throw error;
      return data as unknown as StorePage;
    },
    enabled: !!storeId,
  });
}

export function useCreateStorePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      store_id: string;
      title: string;
      slug: string;
      blocks: StorePage["blocks"];
      is_published?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("store_pages")
        .insert(input as never)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as StorePage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-pages"] });
    },
  });
}

export function useUpdateStorePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StorePage> & { id: string }) => {
      const { data, error } = await supabase
        .from("store_pages")
        .update(updates as never)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as StorePage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-pages"] });
      queryClient.invalidateQueries({ queryKey: ["public-store-pages"] });
      queryClient.invalidateQueries({ queryKey: ["store-page"] });
    },
  });
}

export function useDeleteStorePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("store_pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-pages"] });
      queryClient.invalidateQueries({ queryKey: ["public-store-pages"] });
    },
  });
}
