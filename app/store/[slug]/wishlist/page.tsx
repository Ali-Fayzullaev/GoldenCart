"use client";

import { use } from "react";
import Link from "next/link";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStoreBySlug } from "@/lib/hooks/use-stores";
import { useWishlist, useRemoveFromWishlist } from "@/lib/hooks/use-wishlist";
import { useCartStore } from "@/lib/store/cart-store";
import { useProfile } from "@/lib/hooks/use-profile";
import { formatPrice } from "@/lib/helpers";
import { toast } from "sonner";

export default function WishlistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: store } = useStoreBySlug(slug);
  const { data: items, isLoading } = useWishlist(store?.id);
  const removeFromWishlist = useRemoveFromWishlist();
  const addItem = useCartStore((s) => s.addItem);
  const { data: profile } = useProfile();

  const primaryColor = store?.store_settings?.primary_color || "#f59e0b";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!items?.length) {
    return (
      <div className="text-center py-20">
        <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Избранное пусто</h2>
        <p className="text-gray-500 mb-4">Добавляйте товары, нажимая на ❤️</p>
        <Link href={`/store/${slug}`}>
          <Button style={{ backgroundColor: primaryColor }} className="text-white">
            К покупкам
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-4">
      <h1 className="text-2xl font-bold">Избранное ({items.length})</h1>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl border p-4 flex items-center gap-4"
          >
            <Link href={`/store/${slug}/product/${item.products.id}`}>
              {item.products.images?.[0] ? (
                <img
                  src={item.products.images[0]}
                  alt={item.products.name}
                  className="h-20 w-20 rounded-lg object-cover"
                />
              ) : (
                <div className="h-20 w-20 rounded-lg bg-gray-100 flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-gray-300" />
                </div>
              )}
            </Link>

            <div className="flex-1 min-w-0">
              <Link href={`/store/${slug}/product/${item.products.id}`}>
                <h3 className="font-medium truncate hover:underline">
                  {item.products.name}
                </h3>
              </Link>
              <p className="font-bold mt-1" style={{ color: primaryColor }}>
                {formatPrice(item.products.price)}
              </p>
              {item.products.stock <= 0 && (
                <p className="text-xs text-red-500">Нет в наличии</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {item.products.stock > 0 && (
                <Button
                  size="sm"
                  style={{ backgroundColor: primaryColor }}
                  className="text-white hover:opacity-90"
                  onClick={() => {
                    addItem({
                      product_id: item.products.id,
                      store_id: item.store_id,
                      name: item.products.name,
                      price: item.products.price,
                      image: item.products.images?.[0] || null,
                    });
                    toast.success("Добавлено в корзину");
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  В корзину
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  removeFromWishlist.mutate({
                    productId: item.product_id,
                    storeId: item.store_id,
                  })
                }
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
