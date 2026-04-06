import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ViewedProduct {
  product_id: string;
  store_id: string;
  name: string;
  price: number;
  image: string | null;
  viewed_at: number;
}

interface ViewHistoryState {
  items: ViewedProduct[];
  addView: (product: Omit<ViewedProduct, "viewed_at">) => void;
  getStoreHistory: (storeId: string) => ViewedProduct[];
  clearHistory: () => void;
}

const MAX_ITEMS = 20;

export const useViewHistoryStore = create<ViewHistoryState>()(
  persist(
    (set, get) => ({
      items: [],

      addView: (product) => {
        set((state) => {
          const filtered = state.items.filter(
            (i) => i.product_id !== product.product_id
          );
          return {
            items: [
              { ...product, viewed_at: Date.now() },
              ...filtered,
            ].slice(0, MAX_ITEMS),
          };
        });
      },

      getStoreHistory: (storeId) => {
        return get().items.filter((i) => i.store_id === storeId);
      },

      clearHistory: () => set({ items: [] }),
    }),
    { name: "goldencart-view-history" }
  )
);
