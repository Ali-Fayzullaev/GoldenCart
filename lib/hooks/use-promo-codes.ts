import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { PromoCode } from "@/lib/types/database";

const supabase = createClient();

// Промокоды магазина (для продавца)
export function useStorePromoCodes(storeId: string | undefined) {
  return useQuery({
    queryKey: ["promo-codes", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("store_id", storeId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as PromoCode[];
    },
    enabled: !!storeId,
  });
}

// Создание промокода
export function useCreatePromoCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      store_id: string;
      code: string;
      discount_type: "percent" | "fixed";
      discount_value: number;
      min_order_amount?: number;
      max_uses?: number;
      expires_at?: string;
    }) => {
      const { data, error } = await supabase
        .from("promo_codes")
        .insert({
          store_id: input.store_id,
          code: input.code.toUpperCase(),
          discount_type: input.discount_type,
          discount_value: input.discount_value,
          min_order_amount: input.min_order_amount || 0,
          max_uses: input.max_uses || 0,
          expires_at: input.expires_at || null,
          is_active: true,
        } as never)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as PromoCode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
    },
  });
}

// Удаление промокода
export function useDeletePromoCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("promo_codes")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
    },
  });
}

// Переключение активности
export function useTogglePromoCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("promo_codes")
        .update({ is_active } as never)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
    },
  });
}

// Проверка промокода (для покупателя при оформлении)
export function useValidatePromoCode() {
  return useMutation({
    mutationFn: async ({
      storeId,
      code,
      orderTotal,
    }: {
      storeId: string;
      code: string;
      orderTotal: number;
    }) => {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("store_id", storeId)
        .eq("code", code.toUpperCase())
        .eq("is_active", true)
        .single();

      if (error || !data) throw new Error("Промокод не найден");

      const promo = data as unknown as PromoCode;

      // Проверки
      if (promo.max_uses > 0 && promo.used_count >= promo.max_uses) {
        throw new Error("Промокод исчерпан");
      }

      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        throw new Error("Промокод истёк");
      }

      if (orderTotal < promo.min_order_amount) {
        throw new Error(
          `Минимальная сумма заказа: ${promo.min_order_amount} ₽`
        );
      }

      // Расчёт скидки
      let discount = 0;
      if (promo.discount_type === "percent") {
        discount = Math.round(orderTotal * (promo.discount_value / 100) * 100) / 100;
      } else {
        discount = Math.min(promo.discount_value, orderTotal);
      }

      return { promo, discount };
    },
  });
}
