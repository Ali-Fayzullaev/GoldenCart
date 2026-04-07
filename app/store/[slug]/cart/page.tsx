"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStoreBySlug } from "@/lib/hooks/use-stores";
import { useCartStore } from "@/lib/store/cart-store";
import { formatPrice } from "@/lib/helpers";

export default function CartPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: store } = useStoreBySlug(slug);
  const getStoreItems = useCartStore((s) => s.getStoreItems);
  const getStoreTotal = useCartStore((s) => s.getStoreTotal);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const [items, setItems] = useState<ReturnType<typeof getStoreItems>>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (store) {
      setItems(getStoreItems(store.id));
      setTotal(getStoreTotal(store.id));
    }
  }, [store, getStoreItems, getStoreTotal]);

  // Resync on changes
  const handleQuantity = (productId: string, qty: number) => {
    updateQuantity(productId, qty);
    if (store) {
      setItems(getStoreItems(store.id));
      setTotal(getStoreTotal(store.id));
    }
  };

  const handleRemove = (productId: string) => {
    removeItem(productId);
    if (store) {
      setItems(getStoreItems(store.id));
      setTotal(getStoreTotal(store.id));
    }
  };

  const primaryColor = store?.store_settings?.primary_color || "#f59e0b";

  if (!items.length) {
    return (
      <div className="text-center py-20">
        <ShoppingBag className="h-16 w-16 text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold s-text mb-1">Корзина пуста</h2>
        <p className="s-muted text-sm mb-6">Добавьте товары из каталога</p>
        <Link href={`/store/${slug}`}>
          <Button style={{ backgroundColor: primaryColor }} className="text-white rounded-xl shadow-md hover:opacity-90">
            Перейти в каталог
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold s-text">Корзина</h1>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.product_id}
            className="flex items-center gap-4 s-card rounded-2xl border s-border p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="h-16 w-16 rounded-xl object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-gray-200" />
              </div>
            )}

            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm" style={{ color: primaryColor }}>
                {formatPrice(item.price)}
              </p>
            </div>

            <div className="flex items-center border s-border rounded-xl overflow-hidden">
              <button
                onClick={() => handleQuantity(item.product_id, item.quantity - 1)}
                aria-label="Уменьшить количество"
                className="p-2 s-hover transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="px-3 text-sm font-medium">{item.quantity}</span>
              <button
                onClick={() => handleQuantity(item.product_id, item.quantity + 1)}
                aria-label="Увеличить количество"
                className="p-2 s-hover transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            <p className="font-bold w-24 text-right">
              {formatPrice(item.price * item.quantity)}
            </p>

            <button
              onClick={() => handleRemove(item.product_id)}
              aria-label="Удалить из корзины"
              className="text-red-400 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="s-card rounded-2xl border s-border p-5 flex items-center justify-between shadow-sm">
        <span className="text-lg font-semibold s-text">Итого:</span>
        <span className="text-2xl font-bold" style={{ color: primaryColor }}>
          {formatPrice(total)}
        </span>
      </div>

      <Link href={`/store/${slug}/checkout`} className="block">
        <Button
          size="lg"
          className="w-full text-white hover:opacity-90 rounded-xl h-12 text-base font-semibold shadow-md"
          style={{ backgroundColor: primaryColor }}
        >
          Оформить заказ
        </Button>
      </Link>
    </div>
  );
}
