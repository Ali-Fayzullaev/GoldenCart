"use client";

import { use, useState } from "react";
import { Search, ShoppingCart, Star, SlidersHorizontal, Heart, Clock, GitCompareArrows } from "lucide-react";
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
import { useViewHistoryStore } from "@/lib/store/view-history-store";
import { useCompareStore } from "@/lib/store/compare-store";
import { useProfile } from "@/lib/hooks/use-profile";
import { useStoreProductRatings } from "@/lib/hooks/use-reviews";
import { useWishlistIds, useAddToWishlist, useRemoveFromWishlist } from "@/lib/hooks/use-wishlist";
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
  const [sort, setSort] = useState("newest");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const { data: products, isLoading } = usePublicProducts(store?.id, {
    search,
    category,
    sort,
    priceMin: priceMin ? Number(priceMin) : undefined,
    priceMax: priceMax ? Number(priceMax) : undefined,
  });
  const { data: ratings } = useStoreProductRatings(store?.id);
  const wishlistIds = useWishlistIds(store?.id);
  const getStoreHistory = useViewHistoryStore((s) => s.getStoreHistory);
  const viewedItems = store ? getStoreHistory(store.id) : [];
  const compareItems = useCompareStore((s) => s.getStoreItems)(store?.id || "");
  const isInCompare = useCompareStore((s) => s.isInCompare);

  // Сортировка по популярности (кол-во отзывов) — клиентская
  const sortedProducts =
    sort === "popular" && products && ratings
      ? [...products].sort(
          (a, b) =>
            (ratings[b.id]?.count || 0) - (ratings[a.id]?.count || 0)
        )
      : products;

  const settings = store?.store_settings;
  const primaryColor = settings?.primary_color || "#f59e0b";

  return (
    <div className="space-y-6">
      {/* Welcome */}
      {settings?.welcome_text && (
        <p className="text-lg text-center py-4">{settings.welcome_text}</p>
      )}

      {/* Filters */}
      <div className="space-y-3">
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
          <Select value={sort} onValueChange={(val) => val && setSort(val)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Сортировка" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Сначала новые</SelectItem>
              <SelectItem value="price_asc">Сначала дешёвые</SelectItem>
              <SelectItem value="price_desc">Сначала дорогие</SelectItem>
              <SelectItem value="popular">По популярности</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Расширенные фильтры */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-lg border">
            <span className="text-sm text-gray-500">Цена:</span>
            <Input
              type="number"
              placeholder="от"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="w-24 h-9 text-sm"
              min={0}
            />
            <span className="text-gray-400">—</span>
            <Input
              type="number"
              placeholder="до"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="w-24 h-9 text-sm"
              min={0}
            />
            <span className="text-sm text-gray-400">₽</span>
            {(priceMin || priceMax) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPriceMin("");
                  setPriceMax("");
                }}
                className="text-xs"
              >
                Сбросить
              </Button>
            )}
          </div>
        )}
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
      ) : !sortedProducts?.length ? (
        <div className="text-center py-20">
          <p className="text-gray-400">Товаров пока нет</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              storeSlug={slug}
              storeId={store!.id}
              primaryColor={primaryColor}
              rating={ratings?.[product.id]}
              isWishlisted={wishlistIds.has(product.id)}
              isCompared={isInCompare(product.id)}
            />
          ))}
        </div>
      )}

      {/* Плавающая панель сравнения */}
      {compareItems.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white border shadow-lg rounded-xl px-4 py-3 flex items-center gap-3">
          <GitCompareArrows className="h-5 w-5 text-blue-500" />
          <span className="text-sm font-medium">
            Сравнение: {compareItems.length} из 3
          </span>
          <a
            href={`/store/${slug}/compare`}
            className="text-sm font-semibold text-white px-3 py-1.5 rounded-lg hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            Сравнить
          </a>
        </div>
      )}

      {/* Недавно просмотренные */}
      {viewedItems.length > 0 && (
        <div className="space-y-3 border-t pt-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold">Недавно просмотренные</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {viewedItems.slice(0, 8).map((item) => (
              <a
                key={item.product_id}
                href={`/store/${slug}/product/${item.product_id}`}
                className="shrink-0 w-36 rounded-lg border bg-white hover:shadow-md transition-shadow overflow-hidden"
              >
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-28 object-cover" />
                ) : (
                  <div className="w-full h-28 bg-gray-100 flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-gray-300" />
                  </div>
                )}
                <div className="p-2">
                  <p className="text-xs font-medium line-clamp-2">{item.name}</p>
                  <p className="text-xs font-bold mt-1" style={{ color: primaryColor }}>
                    {formatPrice(item.price)}
                  </p>
                </div>
              </a>
            ))}
          </div>
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
  rating,
  isWishlisted,
  isCompared,
}: {
  product: Product;
  storeSlug: string;
  storeId: string;
  primaryColor: string;
  rating?: { avg: number; count: number };
  isWishlisted: boolean;
  isCompared: boolean;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const { data: profile } = useProfile();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const addToCompare = useCompareStore((s) => s.addToCompare);
  const removeFromCompare = useCompareStore((s) => s.removeFromCompare);

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

  const handleToggleWishlist = () => {
    if (!profile || profile.role !== "customer") {
      toast.error("Войдите, чтобы добавить в избранное");
      return;
    }
    if (isWishlisted) {
      removeFromWishlist.mutate({ productId: product.id, storeId });
    } else {
      addToWishlist.mutate({ productId: product.id, storeId });
      toast.success("Добавлено в избранное");
    }
  };

  const handleToggleCompare = () => {
    if (isCompared) {
      removeFromCompare(product.id);
    } else {
      addToCompare({
        product_id: product.id,
        store_id: storeId,
        name: product.name,
        price: product.price,
        image: product.images[0] || null,
        category: product.category,
        description: product.description || "",
        stock: product.stock,
        variants: product.variants || null,
      });
      toast.success("Добавлено к сравнению");
    }
  };

  return (
    <div className="rounded-xl border overflow-hidden hover:shadow-md transition-shadow bg-white relative">
      {/* Сердечко избранное */}
      <button
        onClick={handleToggleWishlist}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors shadow-sm"
      >
        <Heart
          className="h-4 w-4"
          fill={isWishlisted ? "#ef4444" : "none"}
          stroke={isWishlisted ? "#ef4444" : "#9ca3af"}
        />
      </button>
      {/* Кнопка сравнения */}
      <button
        onClick={handleToggleCompare}
        className="absolute top-2 left-2 z-10 p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors shadow-sm"
      >
        <GitCompareArrows
          className="h-4 w-4"
          stroke={isCompared ? "#3b82f6" : "#9ca3af"}
        />
      </button>
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
        {rating && (
          <div className="flex items-center gap-1 mb-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className="h-3.5 w-3.5"
                  fill={s <= Math.round(rating.avg) ? "#facc15" : "none"}
                  stroke={s <= Math.round(rating.avg) ? "#facc15" : "#d1d5db"}
                />
              ))}
            </div>
            <span className="text-xs text-gray-400">{rating.avg}</span>
          </div>
        )}
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
