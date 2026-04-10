import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Wishlist, WishlistWithProduct } from "@/lib/types/database";

const supabase = createClient();

// Избранное покупателя в конкретном магазине
export function useWishlist(storeId: string | undefined) {
  return useQuery({
    queryKey: ["wishlist", storeId],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return [];

      const { data, error } = await supabase
        .from("wishlists")
        .select("*, products(id, name, price, images, stock)")
        .eq("store_id", storeId!)
        .eq("customer_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as WishlistWithProduct[];
    },
    enabled: !!storeId,
  });
}

// ID избранных товаров (для быстрой проверки)
export function useWishlistIds(storeId: string | undefined) {
  const { data } = useWishlist(storeId);
  const ids = new Set(data?.map((w) => w.product_id) || []);
  return ids;
}

// Добавить в избранное
export function useAddToWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      storeId,
    }: {
      productId: string;
      storeId: string;
    }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Не авторизован");

      const { data, error } = await supabase
        .from("wishlists")
        .insert({
          customer_id: session.user.id,
          product_id: productId,
          store_id: storeId,
        } as never)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Wishlist;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["wishlist", variables.storeId],
      });
    },
  });
}

// Удалить из избранного
export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      storeId,
    }: {
      productId: string;
      storeId: string;
    }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Не авторизован");

      const { error } = await supabase
        .from("wishlists")
        .delete()
        .eq("customer_id", session.user.id)
        .eq("product_id", productId);

      if (error) throw error;
      return { productId, storeId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ["wishlist", result.storeId],
      });
    },
  });
}
