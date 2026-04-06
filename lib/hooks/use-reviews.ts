import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Review, ReviewWithProfile } from "@/lib/types/database";

const supabase = createClient();

// Отзывы к товару (публичные)
export function useProductReviews(productId: string | undefined) {
  return useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, profiles(full_name, avatar_url)")
        .eq("product_id", productId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as ReviewWithProfile[];
    },
    enabled: !!productId,
  });
}

// Средний рейтинг товаров магазина (для каталога)
export function useStoreProductRatings(storeId: string | undefined) {
  return useQuery({
    queryKey: ["product-ratings", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("product_id, rating")
        .eq("store_id", storeId!);

      if (error) throw error;

      // Группируем по product_id
      const ratings: Record<string, { sum: number; count: number }> = {};
      (data as unknown as { product_id: string; rating: number }[]).forEach(
        (r) => {
          if (!ratings[r.product_id]) {
            ratings[r.product_id] = { sum: 0, count: 0 };
          }
          ratings[r.product_id].sum += r.rating;
          ratings[r.product_id].count += 1;
        }
      );

      const result: Record<string, { avg: number; count: number }> = {};
      for (const [pid, { sum, count }] of Object.entries(ratings)) {
        result[pid] = { avg: Math.round((sum / count) * 10) / 10, count };
      }
      return result;
    },
    enabled: !!storeId,
  });
}

// Создание / обновление отзыва
export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      product_id: string;
      store_id: string;
      rating: number;
      comment: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Не авторизован");

      const { data, error } = await supabase
        .from("reviews")
        .upsert(
          {
            product_id: input.product_id,
            customer_id: user.id,
            store_id: input.store_id,
            rating: input.rating,
            comment: input.comment,
          } as never,
          { onConflict: "product_id,customer_id" }
        )
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Review;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["reviews", variables.product_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["product-ratings", variables.store_id],
      });
    },
  });
}

// Удаление отзыва
export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      productId,
      storeId,
    }: {
      id: string;
      productId: string;
      storeId: string;
    }) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
      return { productId, storeId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ["reviews", result.productId],
      });
      queryClient.invalidateQueries({
        queryKey: ["product-ratings", result.storeId],
      });
    },
  });
}
