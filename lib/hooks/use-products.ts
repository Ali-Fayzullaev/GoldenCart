import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Product, ProductVariantOption } from "@/lib/types/database";
import type { ProductInput } from "@/lib/validations";

const supabase = createClient();

// Товары магазина (для дашборда продавца)
export function useStoreProducts(storeId: string | undefined) {
  return useQuery({
    queryKey: ["store-products", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", storeId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as Product[];
    },
    enabled: !!storeId,
  });
}

// Товары магазина (публичные, для витрины)
export function usePublicProducts(
  storeId: string | undefined,
  filters?: {
    search?: string;
    category?: string;
    sort?: string;
    priceMin?: number;
    priceMax?: number;
  }
) {
  return useQuery({
    queryKey: ["public-products", storeId, filters],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*")
        .eq("store_id", storeId!)
        .eq("is_active", true);

      if (filters?.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }
      if (filters?.category && filters.category !== "all") {
        query = query.eq("category", filters.category);
      }
      if (filters?.priceMin !== undefined && filters.priceMin > 0) {
        query = query.gte("price", filters.priceMin);
      }
      if (filters?.priceMax !== undefined && filters.priceMax > 0) {
        query = query.lte("price", filters.priceMax);
      }

      // Сортировка
      switch (filters?.sort) {
        case "price_asc":
          query = query.order("price", { ascending: true });
          break;
        case "price_desc":
          query = query.order("price", { ascending: false });
          break;
        case "newest":
          query = query.order("created_at", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
          break;
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Product[];
    },
    enabled: !!storeId,
  });
}

// Один товар
export function useProduct(productId: string) {
  return useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (error) throw error;
      return data as unknown as Product;
    },
    enabled: !!productId,
  });
}

// Создание товара
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: ProductInput & { store_id: string; images: string[]; variants?: ProductVariantOption[] }
    ) => {
      const { data, error } = await supabase
        .from("products")
        .insert({
          store_id: input.store_id,
          name: input.name,
          description: input.description,
          price: input.price,
          stock: input.stock,
          images: input.images,
          category: input.category,
        } as never)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-products"] });
      queryClient.invalidateQueries({ queryKey: ["public-products"] });
    },
  });
}

// Обновление товара
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { variants, ...rest } = updates;
      const { data, error } = await supabase
        .from("products")
        .update(rest as never)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-products"] });
      queryClient.invalidateQueries({ queryKey: ["public-products"] });
    },
  });
}

// Удаление товара
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-products"] });
      queryClient.invalidateQueries({ queryKey: ["public-products"] });
    },
  });
}
