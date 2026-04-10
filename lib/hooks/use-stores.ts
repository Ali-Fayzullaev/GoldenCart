import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/helpers";
import type { Store, StoreSettings, StoreWithSettings } from "@/lib/types/database";
import type { StoreInput, StoreSettingsInput } from "@/lib/validations";

const supabase = createClient();

// Магазин текущего продавца
export function useMyStore() {
  return useQuery({
    queryKey: ["my-store"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data, error } = await supabase
        .from("stores")
        .select("*, store_settings(*)")
        .eq("owner_id", session.user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return (data as unknown as StoreWithSettings) || null;
    },
  });
}

// Магазин по slug (публичный)
export function useStoreBySlug(slug: string) {
  return useQuery({
    queryKey: ["store", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*, store_settings(*)")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data as unknown as StoreWithSettings;
    },
    enabled: !!slug,
  });
}

// Создание магазина
export function useCreateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: StoreInput & { logo_url?: string }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Не авторизован");

      const slug = slugify(input.name) + "-" + Date.now().toString(36);

      const { data, error } = await supabase
        .from("stores")
        .insert({
          owner_id: session.user.id,
          name: input.name,
          slug,
          description: input.description,
          category: input.category,
          contact_email: input.contact_email,
        } as never)
        .select("*, store_settings(*)")
        .single();

      if (error) throw error;
      return data as unknown as StoreWithSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-store"] });
    },
  });
}

// Обновление магазина
export function useUpdateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Store> & { id: string }) => {
      const { data, error } = await supabase
        .from("stores")
        .update(updates as never)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Store;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-store"] });
    },
  });
}

// Обновление настроек дизайна
export function useUpdateStoreSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      storeId,
      ...updates
    }: StoreSettingsInput & { storeId: string; logo_url?: string | null; banner_url?: string | null; instagram_url?: string; telegram_url?: string; vk_url?: string; whatsapp_url?: string }) => {
      const { data, error } = await supabase
        .from("store_settings")
        .update(updates as never)
        .eq("store_id", storeId)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as StoreSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-store"] });
    },
  });
}
