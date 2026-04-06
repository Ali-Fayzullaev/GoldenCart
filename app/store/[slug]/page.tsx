"use client";

import { use, useState } from "react";
import { Search, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStoreBySlug } from "@/lib/hooks/use-stores";
import { usePublicProducts } from "@/lib/hooks/use-products";
import { useCartStore } from "@/lib/store/cart-store";
import { useProfile } from "@/lib/hooks/use-profile";
import { formatPrice, PRODUCT_CATEGORIES } from "@/lib/helpers";
import { toast } from "sonner";
import type { Product } from "@/lib/types/database";

export default function StoreFrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: store } = useStoreBySlug(slug);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const { data: products, isLoading } = usePublicProducts(store?.id, {
    search,
    category,
  });

  const settings = store?.store_settings;
  const primaryColor = settings?.primary_color || "#f59e0b";

  return (
    <div className="space-y-6">
      {/* Welcome */}
      {settings?.welcome_text && (
        <p className="text-lg text-center py-4">{settings.welcome_text}</p>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Поиск товаров..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={(val) => val && setCategory(val)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Категория" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {PRODUCT_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-3 animate-pulse">
              <div className="h-40 bg-gray-200 rounded mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : !products?.length ? (
        <div className="text-center py-20">
          <p className="text-gray-400">Товаров пока нет</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              storeSlug={slug}
              storeId={store!.id}
              primaryColor={primaryColor}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({
  product,
  storeSlug,
  storeId,
  primaryColor,
}: {
  product: Product;
  storeSlug: string;
  storeId: string;
  primaryColor: string;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const { data: profile } = useProfile();

  const handleAdd = () => {
    if (!profile || profile.role !== "customer") {
      toast.error("Войдите как покупатель чтобы добавить в корзину");
      return;
    }
    addItem({
      product_id: product.id,
      store_id: storeId,
      name: product.name,
      price: product.price,
      image: product.images[0] || null,
    });
    toast.success("Добавлено в корзину");
  };

  return (
    <div className="rounded-xl border overflow-hidden hover:shadow-md transition-shadow bg-white">
      <a href={`/store/${storeSlug}/product/${product.id}`}>
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-40 object-cover"
          />
        ) : (
          <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
            <ShoppingCart className="h-8 w-8 text-gray-300" />
          </div>
        )}
      </a>
      <div className="p-3">
        <a href={`/store/${storeSlug}/product/${product.id}`}>
          <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h3>
        </a>
        <div className="flex items-center justify-between">
          <span className="font-bold" style={{ color: primaryColor }}>
            {formatPrice(product.price)}
          </span>
          {product.stock > 0 ? (
            <Button
              size="sm"
              onClick={handleAdd}
              style={{ backgroundColor: primaryColor }}
              className="text-white hover:opacity-90 text-xs px-2"
            >
              В корзину
            </Button>
          ) : (
            <Badge variant="secondary" className="text-xs">Нет в наличии</Badge>
          )}
        </div>
      </div>
    </div>
  );
}
