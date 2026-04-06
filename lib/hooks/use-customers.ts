import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { StoreCustomerWithProfile } from "@/lib/types/database";

const supabase = createClient();

// Покупатели магазина (для продавца)
export function useStoreCustomers(storeId: string | undefined) {
  return useQuery({
    queryKey: ["store-customers", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_customers")
        .select("*, profiles(full_name, email, avatar_url)")
        .eq("store_id", storeId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as StoreCustomerWithProfile[];
    },
    enabled: !!storeId,
  });
}
