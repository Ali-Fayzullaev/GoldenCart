import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { StoreFaq } from "@/lib/types/database";

const supabase = createClient();

export function useStoreFaqs(storeId: string | undefined) {
  return useQuery({
    queryKey: ["store-faqs", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_faqs")
        .select("*")
        .eq("store_id", storeId!)
        .order("sort_order");
      if (error) throw error;
      return data as unknown as StoreFaq[];
    },
    enabled: !!storeId,
  });
}

export function usePublicStoreFaqs(storeId: string | undefined) {
  return useQuery({
    queryKey: ["public-store-faqs", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_faqs")
        .select("*")
        .eq("store_id", storeId!)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data as unknown as StoreFaq[];
    },
    enabled: !!storeId,
  });
}

export function useCreateStoreFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { store_id: string; question: string; answer: string }) => {
      const { data, error } = await supabase
        .from("store_faqs")
        .insert(input as never)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as StoreFaq;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-faqs"] });
      queryClient.invalidateQueries({ queryKey: ["public-store-faqs"] });
    },
  });
}

export function useUpdateStoreFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StoreFaq> & { id: string }) => {
      const { data, error } = await supabase
        .from("store_faqs")
        .update(updates as never)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as StoreFaq;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-faqs"] });
      queryClient.invalidateQueries({ queryKey: ["public-store-faqs"] });
    },
  });
}

export function useDeleteStoreFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("store_faqs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-faqs"] });
      queryClient.invalidateQueries({ queryKey: ["public-store-faqs"] });
    },
  });
}
