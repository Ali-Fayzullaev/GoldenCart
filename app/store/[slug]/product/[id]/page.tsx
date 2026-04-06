"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStoreBySlug } from "@/lib/hooks/use-stores";
import { useProduct } from "@/lib/hooks/use-products";
import { useCartStore } from "@/lib/store/cart-store";
import { useProfile } from "@/lib/hooks/use-profile";
import { formatPrice } from "@/lib/helpers";
import { toast } from "sonner";
import { useState } from "react";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = use(params);
  const { data: store } = useStoreBySlug(slug);
  const { data: product, isLoading } = useProduct(id);
  const { data: profile } = useProfile();
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const primaryColor = store?.store_settings?.primary_color || "#f59e0b";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Товар не найден</p>
      </div>
    );
  }

  const handleAdd = () => {
    if (!profile || profile.role !== "customer") {
      toast.error("Войдите как покупатель");
      return;
    }
    addItem(
      {
        product_id: product.id,
        store_id: product.store_id,
        name: product.name,
        price: product.price,
        image: product.images[0] || null,
      },
      quantity
    );
    toast.success("Добавлено в корзину");
  };

  return (
    <div className="max-w-5xl mx-auto py-6">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-3">
          {product.images.length > 0 ? (
            <>
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full aspect-square object-cover rounded-xl"
              />
              {product.images.length > 1 && (
                <div className="flex gap-2">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`h-16 w-16 rounded border-2 overflow-hidden ${
                        i === selectedImage ? "border-current" : "border-transparent"
                      }`}
                      style={i === selectedImage ? { borderColor: primaryColor } : {}}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
              <ShoppingBag className="h-20 w-20 text-gray-300" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-3xl font-bold" style={{ color: primaryColor }}>
            {formatPrice(product.price)}
          </p>

          {product.stock > 0 ? (
            <p className="text-sm text-green-600">В наличии: {product.stock} шт.</p>
          ) : (
            <p className="text-sm text-red-500">Нет в наличии</p>
          )}

          <p className="text-gray-600 whitespace-pre-line">{product.description}</p>

          {product.stock > 0 && (
            <div className="flex items-center gap-4 pt-4">
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-gray-50"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 font-medium">{quantity}</span>
                <button
                  onClick={() =>
                    setQuantity(Math.min(product.stock, quantity + 1))
                  }
                  className="p-2 hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <Button
                onClick={handleAdd}
                size="lg"
                style={{ backgroundColor: primaryColor }}
                className="text-white hover:opacity-90 flex-1"
              >
                В корзину — {formatPrice(product.price * quantity)}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
