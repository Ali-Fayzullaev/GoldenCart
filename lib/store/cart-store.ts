import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  product_id: string;
  store_id: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  clearStoreCart: (storeId: string) => void;
  getStoreItems: (storeId: string) => CartItem[];
  getStoreTotal: (storeId: string) => number;
  getStoreItemCount: (storeId: string) => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.product_id === item.product_id
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product_id === item.product_id
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity }] };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.product_id !== productId),
        })),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.product_id !== productId)
              : state.items.map((i) =>
                  i.product_id === productId ? { ...i, quantity } : i
                ),
        })),

      clearCart: () => set({ items: [] }),

      clearStoreCart: (storeId) =>
        set((state) => ({
          items: state.items.filter((i) => i.store_id !== storeId),
        })),

      getStoreItems: (storeId) =>
        get().items.filter((i) => i.store_id === storeId),

      getStoreTotal: (storeId) =>
        get()
          .items.filter((i) => i.store_id === storeId)
          .reduce((sum, i) => sum + i.price * i.quantity, 0),

      getStoreItemCount: (storeId) =>
        get()
          .items.filter((i) => i.store_id === storeId)
          .reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "goldencart-cart" }
  )
);
