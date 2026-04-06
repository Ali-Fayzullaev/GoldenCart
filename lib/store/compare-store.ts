import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CompareProduct {
  product_id: string;
  store_id: string;
  name: string;
  price: number;
  image: string | null;
  category: string;
  description: string;
  stock: number;
  variants: { name: string; values: string[] }[] | null;
}

interface CompareState {
  items: CompareProduct[];
  addToCompare: (product: CompareProduct) => void;
  removeFromCompare: (productId: string) => void;
  getStoreItems: (storeId: string) => CompareProduct[];
  isInCompare: (productId: string) => boolean;
  clearCompare: () => void;
}

const MAX_COMPARE = 3;

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],

      addToCompare: (product) => {
        const { items } = get();
        if (items.find((i) => i.product_id === product.product_id)) return;
        const storeItems = items.filter(
          (i) => i.store_id === product.store_id
        );
        if (storeItems.length >= MAX_COMPARE) return;
        set({ items: [...items, product] });
      },

      removeFromCompare: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.product_id !== productId),
        }));
      },

      getStoreItems: (storeId) => {
        return get().items.filter((i) => i.store_id === storeId);
      },

      isInCompare: (productId) => {
        return get().items.some((i) => i.product_id === productId);
      },

      clearCompare: () => set({ items: [] }),
    }),
    { name: "goldencart-compare" }
  )
);
