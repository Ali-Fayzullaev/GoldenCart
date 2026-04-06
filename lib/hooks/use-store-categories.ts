import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { StoreCategory } from "@/lib/types/database";

const supabase = createClient();

export function useStoreCategories(storeId: string | undefined) {
  return useQuery({
    queryKey: ["store-categories", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_categories")
        .select("*")
        .eq("store_id", storeId!)
        .order("sort_order");

      if (error) throw error;
      return data as unknown as StoreCategory[];
    },
    enabled: !!storeId,
  });
}

export function useCreateStoreCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      store_id: string;
      name: string;
      parent_id?: string | null;
      sort_order?: number;
    }) => {
      const { data, error } = await supabase
        .from("store_categories")
        .insert(input as never)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as StoreCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-categories"] });
    },
  });
}

export function useUpdateStoreCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StoreCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from("store_categories")
        .update(updates as never)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as StoreCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-categories"] });
    },
  });
}

export function useDeleteStoreCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("store_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-categories"] });
    },
  });
}
