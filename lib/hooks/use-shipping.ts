import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { ShippingMethod } from "@/lib/types/database";

const supabase = createClient();

export function useShippingMethods(storeId: string | undefined) {
  return useQuery({
    queryKey: ["shipping-methods", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_methods")
        .select("*")
        .eq("store_id", storeId!)
        .order("sort_order");
      if (error) throw error;
      return data as unknown as ShippingMethod[];
    },
    enabled: !!storeId,
  });
}

export function useActiveShippingMethods(storeId: string | undefined) {
  return useQuery({
    queryKey: ["active-shipping-methods", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_methods")
        .select("*")
        .eq("store_id", storeId!)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data as unknown as ShippingMethod[];
    },
    enabled: !!storeId,
  });
}

export function useCreateShippingMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { store_id: string; name: string; price: number; min_order_free?: number | null }) => {
      const { data, error } = await supabase
        .from("shipping_methods")
        .insert(input as never)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ShippingMethod;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-methods"] });
      queryClient.invalidateQueries({ queryKey: ["active-shipping-methods"] });
    },
  });
}

export function useUpdateShippingMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ShippingMethod> & { id: string }) => {
      const { data, error } = await supabase
        .from("shipping_methods")
        .update(updates as never)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ShippingMethod;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-methods"] });
      queryClient.invalidateQueries({ queryKey: ["active-shipping-methods"] });
    },
  });
}

export function useDeleteShippingMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shipping_methods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-methods"] });
      queryClient.invalidateQueries({ queryKey: ["active-shipping-methods"] });
    },
  });
}
