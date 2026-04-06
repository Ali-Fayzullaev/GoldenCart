import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Order, OrderWithItems } from "@/lib/types/database";

const supabase = createClient();

// Заказы для продавца (по его магазину)
export function useSellerOrders(storeId: string | undefined) {
  return useQuery({
    queryKey: ["seller-orders", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name, images))")
        .eq("store_id", storeId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as OrderWithItems[];
    },
    enabled: !!storeId,
  });
}

// Заказы покупателя в конкретном магазине
export function useCustomerOrders(storeId: string | undefined) {
  return useQuery({
    queryKey: ["customer-orders", storeId],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name, images))")
        .eq("store_id", storeId!)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as OrderWithItems[];
    },
    enabled: !!storeId,
  });
}

// Создание заказа
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      store_id: string;
      shipping_address: string;
      phone: string;
      notes: string;
      items: { product_id: string; quantity: number; price: number }[];
      discount?: number;
      promo_code?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Не авторизован");

      const subtotal = input.items.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );
      const totalAmount = Math.max(0, subtotal - (input.discount || 0));

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          store_id: input.store_id,
          customer_id: user.id,
          total_amount: totalAmount,
          shipping_address: input.shipping_address,
          phone: input.phone,
          notes: input.notes || "",
          status: "pending",
        } as never)
        .select()
        .single();

      if (orderError) throw orderError;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orderId = (order as any).id;

      const orderItems = input.items.map((item) => ({
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_time: item.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems as never);

      if (itemsError) throw itemsError;

      // Увеличиваем счётчик использования промокода
      if (input.promo_code) {
        await supabase.rpc("increment_promo_usage" as never, {
          promo_code_text: input.promo_code,
          promo_store_id: input.store_id,
        } as never);
      }

      return order as unknown as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      queryClient.invalidateQueries({ queryKey: ["seller-orders"] });
      queryClient.invalidateQueries({ queryKey: ["public-products"] });
    },
  });
}

// Обновление статуса заказа (для продавца)
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: string;
      status: Order["status"];
    }) => {
      const { data, error } = await supabase
        .from("orders")
        .update({ status } as never)
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-orders"] });
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
    },
  });
}
