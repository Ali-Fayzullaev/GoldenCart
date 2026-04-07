import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { CustomerAddress } from "@/lib/types/database";

const supabase = createClient();

export function useCustomerAddresses() {
  return useQuery({
    queryKey: ["customer-addresses"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("customer_addresses")
        .select("*")
        .eq("customer_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as CustomerAddress[];
    },
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { label: string; address: string; phone: string; is_default: boolean }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Не авторизован");

      const { data, error } = await supabase
        .from("customer_addresses")
        .insert({ ...input, customer_id: user.id } as never)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as CustomerAddress;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-addresses"] });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; label?: string; address?: string; phone?: string; is_default?: boolean }) => {
      const { data, error } = await supabase
        .from("customer_addresses")
        .update(updates as never)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as CustomerAddress;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-addresses"] });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("customer_addresses")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-addresses"] });
    },
  });
}
