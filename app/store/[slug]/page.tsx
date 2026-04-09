"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Search, ShoppingCart, Star, SlidersHorizontal, Heart, Clock, GitCompareArrows, ChevronLeft, ChevronRight, Eye, X, Minus, Plus, ArrowUpDown, Grid3X3, LayoutGrid, Check, Package } from "lucide-react";
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
import { usePublicStoreBanners } from "@/lib/hooks/use-store-banners";
import { useStoreCategories } from "@/lib/hooks/use-store-categories";
import { formatPrice, PRODUCT_CATEGORIES } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Product } from "@/lib/types/database";

export default function StoreFrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: store } = useStoreBySlug(slug);
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [cardStyle, setCardStyle] = useState<"standard" | "compact" | "elegant" | "minimal">("standard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const ITEMS_PER_PAGE = 12;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
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
  const compareItems = useCompareStore((s) => s.items).filter(
    (i) => store && i.store_id === store.id
  );
  const compareIds = new Set(compareItems.map((i) => i.product_id));
  const { data: banners } = usePublicStoreBanners(store?.id);
  const { data: storeCategories } = useStoreCategories(store?.id);

  // Сортировка по популярности (кол-во отзывов) — клиентская
  const filteredProducts = (() => {
    let list = sort === "rating" && products && ratings
      ? [...products].sort(
          (a, b) => (ratings[b.id]?.avg || 0) - (ratings[a.id]?.avg || 0)
        )
      : sort === "popular" && products && ratings
      ? [...products].sort(
          (a, b) =>
            (ratings[b.id]?.count || 0) - (ratings[a.id]?.count || 0)
        )
      : products;
    if (inStockOnly && list) {
      list = list.filter((p) => p.stock > 0);
    }
    return list;
  })();

  // Sync search from URL (header search modal navigates with ?q=)
  useEffect(() => {
    const q = searchParams.get("q") || "";
    if (q !== search) setSearch(q);
  }, [searchParams]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [search, category, sort, priceMin, priceMax, inStockOnly, minRating]);

  const activeFilterCount = [
    category !== "all",
    !!priceMin,
    !!priceMax,
    inStockOnly,
  ].filter(Boolean).length;

  const settings = store?.store_settings;
  const primaryColor = settings?.primary_color || "#f59e0b";

  // Sync card style from seller settings
  useEffect(() => {
    const s = (settings as any)?.card_style;
    if (s && ["standard", "compact", "elegant", "minimal"].includes(s)) {
      setCardStyle(s);
    }
  }, [settings]);

  // Card style from seller settings
  const effectiveCardStyle = cardStyle;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stories */}
      {banners && banners.filter((b: any) => b.banner_type === "story" && b.is_active).length > 0 && (
        <StoriesRow stories={banners.filter((b: any) => b.banner_type === "story" && b.is_active)} primaryColor={primaryColor} />
      )}


      {/* Welcome */}
      {settings?.welcome_text && (
        <p className="text-lg text-center py-4 s-muted">{settings.welcome_text}</p>
      )}

      {/* Category chips */}
      {(storeCategories?.length || 0) > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setCategory("all")}
            className={cn(
              "shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all",
              category === "all"
                ? "text-white shadow-md"
                : "s-card text-gray-600 border s-border hover:border-gray-300 s-hover"
            )}
            style={category === "all" ? { backgroundColor: primaryColor } : undefined}
          >
            Все
          </button>
          {(storeCategories && storeCategories.length > 0
            ? storeCategories.map((c) => c.name)
            : PRODUCT_CATEGORIES
          ).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(category === cat ? "all" : cat)}
              className={cn(
                "shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all",
                category === cat
                  ? "text-white shadow-md"
                  : "s-card text-gray-600 border s-border hover:border-gray-300 s-hover"
              )}
              style={category === cat ? { backgroundColor: primaryColor } : undefined}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Main layout: sidebar + content */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* ── Desktop Sidebar ── */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-20 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Поиск товаров..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 rounded-2xl bg-white border-gray-200/80 shadow-sm text-sm placeholder:text-gray-300"
              />
            </div>

            {/* Main filters card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden">
              {/* Sort */}
              <div className="p-4">
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5 block">Сортировка</label>
                <Select value={sort} onValueChange={(val) => val && setSort(val)}>
                  <SelectTrigger className="h-10 rounded-xl text-sm border-gray-200/80">
                    <SelectValue placeholder="Сортировка" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Сначала новые</SelectItem>
                    <SelectItem value="price_asc">Сначала дешёвые</SelectItem>
                    <SelectItem value="price_desc">Сначала дорогие</SelectItem>
                    <SelectItem value="popular">По популярности</SelectItem>
                    <SelectItem value="rating">По рейтингу</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category (if no chips) */}
              {!(storeCategories?.length) && (
                <div className="p-4">
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5 block">Категория</label>
                  <Select value={category} onValueChange={(val) => val && setCategory(val)}>
                    <SelectTrigger className="h-10 rounded-xl text-sm border-gray-200/80">
                      <SelectValue placeholder="Все категории" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все категории</SelectItem>
                      {PRODUCT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Price */}
              <div className="p-4">
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5 block">Цена</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-300 font-medium">₽</span>
                    <Input
                      type="number"
                      placeholder="от"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      className="pl-7 h-9 rounded-xl text-sm border-gray-200/80"
                      min={0}
                    />
                  </div>
                  <div className="w-3 h-px bg-gray-200" />
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-300 font-medium">₽</span>
                    <Input
                      type="number"
                      placeholder="до"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      className="pl-7 h-9 rounded-xl text-sm border-gray-200/80"
                      min={0}
                    />
                  </div>
                </div>
              </div>

              {/* In stock */}
              <div className="px-4 py-3.5">
                <label className="flex items-center gap-3 cursor-pointer select-none group/check">
                  <div
                    className={cn(
                      "h-5 w-5 rounded-lg border-2 flex items-center justify-center transition-all",
                      inStockOnly ? "border-transparent shadow-sm" : "border-gray-300 group-hover/check:border-gray-400"
                    )}
                    style={inStockOnly ? { backgroundColor: primaryColor } : undefined}
                    onClick={() => setInStockOnly(!inStockOnly)}
                  >
                    {inStockOnly && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <span className="text-sm text-gray-700 font-medium">Только в наличии</span>
                </label>
              </div>

              {/* Rating */}
              <div className="p-4">
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5 block">Рейтинг</label>
                <div className="space-y-0.5">
                  {[4, 3, 2, 1].map((r) => (
                    <button
                      key={r}
                      onClick={() => setMinRating(minRating === r ? 0 : r)}
                      className={cn(
                        "flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm transition-all",
                        minRating === r
                          ? "font-semibold"
                          : "text-gray-500 hover:bg-gray-50"
                      )}
                      style={minRating === r ? { backgroundColor: primaryColor + '15', color: primaryColor } : undefined}
                    >
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className="h-3.5 w-3.5" fill={s <= r ? "#facc15" : "none"} stroke={s <= r ? "#facc15" : "#d1d5db"} />
                        ))}
                      </div>
                      <span className="text-xs">и выше</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* View options card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
              {/* View mode */}
              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5 block">Отображение</label>
                <div className="flex gap-1 bg-gray-50 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-all",
                      viewMode === "grid" ? "shadow-sm text-white" : "text-gray-500 hover:text-gray-700"
                    )}
                    style={viewMode === "grid" ? { backgroundColor: primaryColor } : undefined}
                  >
                    <Grid3X3 className="h-3.5 w-3.5" /> Сетка
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-all",
                      viewMode === "list" ? "shadow-sm text-white" : "text-gray-500 hover:text-gray-700"
                    )}
                    style={viewMode === "list" ? { backgroundColor: primaryColor } : undefined}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" /> Список
                  </button>
                </div>
              </div>

              {/* Card style */}
              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5 block">Стиль карточек</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { key: "standard", label: "Стандарт" },
                      { key: "compact", label: "Компакт" },
                      { key: "elegant", label: "Элегант" },
                      { key: "minimal", label: "Минимал" },
                    ] as const
                  ).map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setCardStyle(s.key)}
                      className={cn(
                        "px-3 py-2 rounded-xl text-xs font-medium transition-all border",
                        cardStyle === s.key
                          ? "border-transparent shadow-sm text-white"
                          : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      )}
                      style={cardStyle === s.key ? { backgroundColor: primaryColor } : undefined}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Reset */}
            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  setCategory("all");
                  setPriceMin("");
                  setPriceMax("");
                  setInStockOnly(false);
                  setMinRating(0);
                  setSearch("");
                }}
                className="w-full text-xs text-center py-2.5 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <X className="h-3 w-3" />
                Сбросить фильтры ({activeFilterCount})
              </button>
            )}
          </div>
        </aside>

        {/* ── Mobile filter bar ── */}
        <div className="lg:hidden w-full space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Поиск..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl bg-white border-gray-200/80 shadow-sm text-sm placeholder:text-gray-300"
              />
            </div>
            <Select value={sort} onValueChange={(val) => val && setSort(val)}>
              <SelectTrigger className="w-40 h-10 rounded-xl bg-white shadow-sm text-sm border-gray-200/80">
                <ArrowUpDown className="h-3.5 w-3.5 mr-1 text-gray-400" />
                <SelectValue placeholder="Сорт." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Новые</SelectItem>
                <SelectItem value="price_asc">Дешёвые</SelectItem>
                <SelectItem value="price_desc">Дорогие</SelectItem>
                <SelectItem value="popular">Популярные</SelectItem>
                <SelectItem value="rating">По рейтингу</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl shrink-0 relative"
              style={activeFilterCount > 0 ? { borderColor: primaryColor } : undefined}
              onClick={() => setSidebarOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 h-4 w-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>

          {/* Active filter badges (mobile) */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {category !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-white" style={{ backgroundColor: primaryColor }}>
                  {category}
                  <button onClick={() => setCategory("all")}><X className="h-3 w-3" /></button>
                </span>
              )}
              {(priceMin || priceMax) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-white" style={{ backgroundColor: primaryColor }}>
                  {priceMin || "0"}–{priceMax || "∞"} ₽
                  <button onClick={() => { setPriceMin(""); setPriceMax(""); }}><X className="h-3 w-3" /></button>
                </span>
              )}
              {inStockOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-white" style={{ backgroundColor: primaryColor }}>
                  В наличии
                  <button onClick={() => setInStockOnly(false)}><X className="h-3 w-3" /></button>
                </span>
              )}
              {minRating > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-white" style={{ backgroundColor: primaryColor }}>
                  ★ {minRating}+
                  <button onClick={() => setMinRating(0)}><X className="h-3 w-3" /></button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Mobile sidebar drawer ── */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setSidebarOpen(false)} />
            <aside className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white overflow-y-auto animate-in slide-in-from-right duration-200 shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div>
                  <h3 className="font-semibold text-gray-900">Фильтры</h3>
                  {activeFilterCount > 0 && (
                    <p className="text-[11px] text-gray-400 mt-0.5">Активных: {activeFilterCount}</p>
                  )}
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <div className="p-4 space-y-5">
                {/* Category */}
                {!(storeCategories?.length) && (
                  <div>
                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5 block">Категория</label>
                    <Select value={category} onValueChange={(val) => val && setCategory(val)}>
                      <SelectTrigger className="h-10 rounded-xl text-sm border-gray-200/80">
                        <SelectValue placeholder="Все" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все категории</SelectItem>
                        {PRODUCT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Price */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5 block">Цена</label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-300 font-medium">₽</span>
                      <Input type="number" placeholder="от" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} className="pl-7 h-9 rounded-xl text-sm border-gray-200/80" min={0} />
                    </div>
                    <div className="w-3 h-px bg-gray-200" />
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-300 font-medium">₽</span>
                      <Input type="number" placeholder="до" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} className="pl-7 h-9 rounded-xl text-sm border-gray-200/80" min={0} />
                    </div>
                  </div>
                </div>

                {/* In stock */}
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div
                    className={cn("h-5 w-5 rounded-lg border-2 flex items-center justify-center transition-all", inStockOnly ? "border-transparent shadow-sm" : "border-gray-300")}
                    style={inStockOnly ? { backgroundColor: primaryColor } : undefined}
                    onClick={() => setInStockOnly(!inStockOnly)}
                  >
                    {inStockOnly && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <span className="text-sm text-gray-700 font-medium">Только в наличии</span>
                </label>

                {/* Rating */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5 block">Рейтинг</label>
                  <div className="space-y-0.5">
                    {[4, 3, 2, 1].map((r) => (
                      <button
                        key={r}
                        onClick={() => setMinRating(minRating === r ? 0 : r)}
                        className={cn(
                          "flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm transition-all",
                          minRating === r ? "font-semibold" : "text-gray-500 hover:bg-gray-50"
                        )}
                        style={minRating === r ? { backgroundColor: primaryColor + '15', color: primaryColor } : undefined}
                      >
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className="h-3.5 w-3.5" fill={s <= r ? "#facc15" : "none"} stroke={s <= r ? "#facc15" : "#d1d5db"} />
                          ))}
                        </div>
                        <span className="text-xs">и выше</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* View */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5 block">Вид</label>
                  <div className="flex gap-1 bg-gray-50 rounded-xl p-1">
                    <button onClick={() => setViewMode("grid")} className={cn("flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-all", viewMode === "grid" ? "shadow-sm text-white" : "text-gray-500")} style={viewMode === "grid" ? { backgroundColor: primaryColor } : undefined}>
                      <Grid3X3 className="h-3.5 w-3.5" /> Сетка
                    </button>
                    <button onClick={() => setViewMode("list")} className={cn("flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-all", viewMode === "list" ? "shadow-sm text-white" : "text-gray-500")} style={viewMode === "list" ? { backgroundColor: primaryColor } : undefined}>
                      <LayoutGrid className="h-3.5 w-3.5" /> Список
                    </button>
                  </div>
                </div>

                {/* Card style */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5 block">Стиль</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {([{ key: "standard", label: "Стандарт" }, { key: "compact", label: "Компакт" }, { key: "elegant", label: "Элегант" }, { key: "minimal", label: "Минимал" }] as const).map((s) => (
                      <button key={s.key} onClick={() => setCardStyle(s.key)} className={cn("px-3 py-2 rounded-xl text-xs font-medium transition-all border", cardStyle === s.key ? "border-transparent shadow-sm text-white" : "border-gray-200 text-gray-500 hover:border-gray-300")} style={cardStyle === s.key ? { backgroundColor: primaryColor } : undefined}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset + Apply */}
                <div className="flex gap-2 pt-2">
                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => { setCategory("all"); setPriceMin(""); setPriceMax(""); setInStockOnly(false); setMinRating(0); setSearch(""); }}
                      className="flex-1 text-xs py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Сбросить
                    </button>
                  )}
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="flex-1 text-xs py-2.5 rounded-xl text-white font-medium shadow-sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Показать результаты
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* ── Content area ── */}
        <div className="flex-1 min-w-0">
          {/* Results count */}
          {filteredProducts && filteredProducts.length > 0 && (
            <div className="hidden lg:flex items-center justify-between mb-4">
              <p className="text-sm s-muted">
                {filteredProducts.length} {filteredProducts.length === 1 ? "товар" : filteredProducts.length < 5 ? "товара" : "товаров"}
              </p>
            </div>
          )}

          {/* Products grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="rounded-2xl s-card border s-border overflow-hidden animate-pulse">
                  <div className="h-52 bg-gray-100" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-100 rounded-lg w-3/4" />
                    <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
                    <div className="h-9 bg-gray-100 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : !filteredProducts?.length ? (
            <div className="text-center py-20">
              <Package className="h-16 w-16 text-gray-300/60 mx-auto mb-4" />
              <h3 className="text-lg font-semibold s-text mb-1">Ничего не найдено</h3>
              <p className="s-muted text-sm">Попробуйте изменить фильтры или поисковый запрос</p>
              {activeFilterCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 rounded-xl"
                  onClick={() => {
                    setCategory("all");
                    setPriceMin("");
                    setPriceMax("");
                    setInStockOnly(false);
                    setMinRating(0);
                    setSearch("");
                  }}
                >
                  Сбросить фильтры
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className={cn(
                "gap-3 sm:gap-4",
                viewMode === "grid"
                  ? effectiveCardStyle === "compact"
                    ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                    : effectiveCardStyle === "elegant"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2"
                    : "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3"
                  : "flex flex-col"
              )}>
                {filteredProducts.slice(0, visibleCount).map((product) => (
                  viewMode === "grid" ? (
                    <ProductCard
                      key={product.id}
                      product={product}
                      storeSlug={slug}
                      storeId={store!.id}
                      primaryColor={primaryColor}
                      rating={ratings?.[product.id]}
                      isWishlisted={wishlistIds.has(product.id)}
                      isCompared={compareIds.has(product.id)}
                      onQuickView={() => setQuickViewProduct(product)}
                      cardStyle={effectiveCardStyle}
                    />
                  ) : (
                    <ProductListItem
                      key={product.id}
                      product={product}
                      storeSlug={slug}
                      storeId={store!.id}
                      primaryColor={primaryColor}
                      rating={ratings?.[product.id]}
                      isWishlisted={wishlistIds.has(product.id)}
                      isCompared={compareIds.has(product.id)}
                      onQuickView={() => setQuickViewProduct(product)}
                    />
                  )
                ))}
              </div>

              {/* Show more */}
              {visibleCount < filteredProducts.length && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    className="rounded-xl px-6 sm:px-8 h-10 sm:h-11 shadow-sm text-sm"
                    onClick={() => setVisibleCount((c) => c + ITEMS_PER_PAGE)}
                  >
                    Показать ещё ({filteredProducts.length - visibleCount})
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Плавающая панель сравнения */}
      {compareItems.length > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-xl border s-border shadow-2xl rounded-2xl px-5 py-3.5 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <GitCompareArrows className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-semibold text-gray-800">
              Сравнение: {compareItems.length}/3
            </span>
          </div>
          <a
            href={`/store/${slug}/compare`}
            className="text-sm font-semibold text-white px-4 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-md"
            style={{ backgroundColor: primaryColor }}
          >
            Сравнить
          </a>
        </div>
      )}

      {/* Недавно просмотренные */}
      {viewedItems.length > 0 && (
        <div className="space-y-4 border-t s-border pt-8">
          <div className="flex items-center gap-2.5">
            <Clock className="h-5 w-5 s-muted" />
            <h2 className="text-base sm:text-lg font-bold s-text">Недавно просмотренные</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {viewedItems.slice(0, 8).map((item) => (
              <a
                key={item.product_id}
                href={`/store/${slug}/product/${item.product_id}`}
                className="shrink-0 w-36 rounded-2xl border s-border s-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group/recent"
              >
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-28 object-cover group-hover/recent:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-28 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                    <Package className="h-6 w-6 text-gray-200" />
                  </div>
                )}
                <div className="p-2.5">
                  <p className="text-xs font-medium s-text line-clamp-2">{item.name}</p>
                  <p className="text-xs font-bold mt-1" style={{ color: primaryColor }}>
                    {formatPrice(item.price)}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Quick View Modal */}
      {quickViewProduct && store && (
        <QuickViewModal
          product={quickViewProduct}
          storeId={store.id}
          storeSlug={slug}
          primaryColor={primaryColor}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </div>
  );
}

function ImageCarousel({ images, alt, outOfStock, className }: { images: string[]; alt: string; outOfStock: boolean; className?: string }) {
  const [idx, setIdx] = useState(0);
  const count = images.length;

  return (
    <div
      className="relative overflow-hidden"
      onMouseMove={(e) => {
        if (count <= 1) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const segment = Math.floor((x / rect.width) * count);
        setIdx(Math.min(segment, count - 1));
      }}
      onMouseLeave={() => setIdx(0)}
    >
      {images.length > 0 ? (
        <>
          <img
            src={images[idx] || images[0]}
            alt={alt}
            className={cn(
              `w-full ${className || "h-52 sm:h-64"} object-cover transition-[opacity] duration-200`,
              outOfStock && "opacity-60"
            )}
          />
          {count > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "block rounded-full transition-all duration-200",
                    i === idx ? "w-4 h-1.5 bg-white shadow-sm" : "w-1.5 h-1.5 bg-white/50"
                  )}
                />
              ))}
            </div>
          )}
          {count > 1 && (
            <div className="absolute inset-0 hidden group-hover:flex pointer-events-none">
              {images.map((_, i) => (
                <div key={i} className="flex-1 border-r border-transparent last:border-r-0" />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className={`w-full ${className || "h-52 sm:h-64"} bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center`}>
          <Package className="h-10 w-10 text-gray-200" />
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
  onQuickView,
  cardStyle = "standard",
}: {
  product: Product;
  storeSlug: string;
  storeId: string;
  primaryColor: string;
  rating?: { avg: number; count: number };
  isWishlisted: boolean;
  isCompared: boolean;
  onQuickView: () => void;
  cardStyle?: "standard" | "compact" | "elegant" | "minimal";
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
    }
  };

  const isCompact = cardStyle === "compact";
  const isElegant = cardStyle === "elegant";
  const isMinimal = cardStyle === "minimal";

  return (
    <div className={cn(
      "group border s-border overflow-hidden s-card relative flex flex-col transition-all duration-300",
      isCompact ? "rounded-xl shadow-none hover:shadow-md" : "rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5",
      isElegant && "rounded-3xl"
    )}>
      {/* Action overlay */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button onClick={handleToggleWishlist} aria-label="Избранное" className="p-2 rounded-xl bg-white/90 backdrop-blur-sm shadow-md hover:bg-white transition-colors">
          <Heart className="h-4 w-4" fill={isWishlisted ? "#ef4444" : "none"} stroke={isWishlisted ? "#ef4444" : "#6b7280"} />
        </button>
        {!isCompact && (
          <>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickView(); }} aria-label="Быстрый просмотр" className="p-2 rounded-xl bg-white/90 backdrop-blur-sm shadow-md hover:bg-white transition-colors">
              <Eye className="h-4 w-4 text-gray-600" />
            </button>
            <button onClick={handleToggleCompare} aria-label="Сравнить" className="p-2 rounded-xl bg-white/90 backdrop-blur-sm shadow-md hover:bg-white transition-colors">
              <GitCompareArrows className="h-4 w-4" stroke={isCompared ? "#3b82f6" : "#6b7280"} />
            </button>
          </>
        )}
      </div>
      {/* Mobile wishlist */}
      <button onClick={handleToggleWishlist} aria-label="Избранное" className="absolute top-3 right-3 z-10 p-2 rounded-xl bg-white/90 backdrop-blur-sm shadow-md md:hidden">
        <Heart className="h-4 w-4" fill={isWishlisted ? "#ef4444" : "none"} stroke={isWishlisted ? "#ef4444" : "#6b7280"} />
      </button>

      {/* Badges */}
      {product.stock <= 0 && (
        <div className="absolute top-3 left-3 z-10">
          <span className={cn("px-2.5 py-1 rounded-lg bg-gray-900/70 text-white font-semibold backdrop-blur-sm", isCompact ? "text-[9px]" : "text-[10px]")}>Нет в наличии</span>
        </div>
      )}
      {product.stock > 0 && (Date.now() - new Date(product.created_at).getTime() < 7 * 24 * 60 * 60 * 1000) && (
        <div className="absolute top-3 left-3 z-10">
          <span className={cn("px-2.5 py-1 rounded-lg text-white font-semibold shadow-md", isCompact ? "text-[9px]" : "text-[10px]")} style={{ backgroundColor: primaryColor }}>Новинка</span>
        </div>
      )}

      <a href={`/store/${storeSlug}/product/${product.id}`} className="block">
        <ImageCarousel images={product.images} alt={product.name} outOfStock={product.stock <= 0} className={isCompact ? "h-36 sm:h-44" : isElegant ? "h-64 sm:h-80" : undefined} />
      </a>

      <div className={cn("flex-1 flex flex-col", isCompact ? "p-2.5 space-y-1" : isElegant ? "p-5 space-y-2.5" : "p-3.5 space-y-1.5")}>
        <a href={`/store/${storeSlug}/product/${product.id}`}>
          <h3 className={cn("font-semibold s-text leading-snug", isCompact ? "text-xs line-clamp-1" : isElegant ? "text-base line-clamp-2" : "text-sm line-clamp-2")}>
            {product.name}
          </h3>
        </a>

        {!isMinimal && product.category && (
          <span className={cn("s-muted truncate block", isCompact ? "text-[10px]" : "text-[11px]")}>{product.category}</span>
        )}

        {isElegant && product.description && (
          <p className="text-xs s-muted line-clamp-2 leading-relaxed">{product.description}</p>
        )}

        {!isCompact && rating && (
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={isElegant ? "h-4 w-4" : "h-3.5 w-3.5"} fill={s <= Math.round(rating.avg) ? "#facc15" : "none"} stroke={s <= Math.round(rating.avg) ? "#facc15" : "#e5e7eb"} />
              ))}
            </div>
            <span className="text-xs s-muted">({rating.count})</span>
          </div>
        )}

        <div className={cn("flex items-end justify-between mt-auto", isCompact ? "pt-1" : "pt-2")}>
          <span className={cn("font-bold", isCompact ? "text-sm" : isElegant ? "text-xl" : "text-lg")} style={{ color: primaryColor }}>
            {formatPrice(product.price)}
          </span>
          {product.stock > 0 ? (
            isMinimal ? (
              <button onClick={handleAdd} className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:opacity-80" style={{ backgroundColor: primaryColor, color: "white" }}>
                Купить
              </button>
            ) : (
              <button
                onClick={handleAdd}
                className={cn("rounded-xl text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all", isCompact ? "p-2" : isElegant ? "px-4 py-2.5 rounded-2xl flex items-center gap-1.5" : "p-2.5")}
                style={{ backgroundColor: primaryColor }}
              >
                <ShoppingCart className={isCompact ? "h-3.5 w-3.5" : "h-4 w-4"} />
                {isElegant && <span className="text-xs font-medium">В корзину</span>}
              </button>
            )
          ) : (
            <span className={cn("s-muted font-medium", isCompact ? "text-[10px]" : "text-xs")}>Нет в наличии</span>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductListItem({
  product,
  storeSlug,
  storeId,
  primaryColor,
  rating,
  isWishlisted,
  isCompared,
  onQuickView,
}: {
  product: Product;
  storeSlug: string;
  storeId: string;
  primaryColor: string;
  rating?: { avg: number; count: number };
  isWishlisted: boolean;
  isCompared: boolean;
  onQuickView: () => void;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const { data: profile } = useProfile();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

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

  const isNew = product.stock > 0 && (Date.now() - new Date(product.created_at).getTime() < 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="group rounded-2xl border s-border overflow-hidden s-card shadow-sm hover:shadow-lg transition-all duration-300 flex">
      {/* Image */}
      <a href={`/store/${storeSlug}/product/${product.id}`} className="shrink-0 relative w-36 sm:w-48 overflow-hidden">
        {product.images[0] ? (
          <ImageCarousel images={product.images} alt={product.name} outOfStock={product.stock <= 0} className="h-full" />
        ) : (
          <div className="w-full h-full min-h-[120px] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
            <Package className="h-8 w-8 text-gray-200" />
          </div>
        )}
        {product.stock <= 0 && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-gray-900/70 text-white text-[10px] font-semibold backdrop-blur-sm">
            Нет в наличии
          </span>
        )}
        {isNew && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-white text-[10px] font-semibold shadow-md" style={{ backgroundColor: primaryColor }}>
            Новинка
          </span>
        )}
      </a>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
        <div>
          <a href={`/store/${storeSlug}/product/${product.id}`}>
            <h3 className="font-semibold text-sm sm:text-base s-text line-clamp-2 group-hover:text-gray-700 transition-colors">
              {product.name}
            </h3>
          </a>
          {product.description && (
            <p className="text-xs sm:text-sm s-muted mt-1 line-clamp-2">{product.description}</p>
          )}
          {rating && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className="h-3.5 w-3.5"
                    fill={s <= Math.round(rating.avg) ? "#facc15" : "none"}
                    stroke={s <= Math.round(rating.avg) ? "#facc15" : "#e5e7eb"}
                  />
                ))}
              </div>
              <span className="text-xs s-muted">({rating.count})</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-bold" style={{ color: primaryColor }}>
            {formatPrice(product.price)}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleWishlist}
              aria-label="Добавить в избранное"
              className="p-2 rounded-xl border s-border s-hover transition-colors"
            >
              <Heart className="h-4 w-4" fill={isWishlisted ? "#ef4444" : "none"} stroke={isWishlisted ? "#ef4444" : "#6b7280"} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); onQuickView(); }}
              aria-label="Быстрый просмотр"
              className="p-2 rounded-xl border s-border s-hover transition-colors hidden sm:flex"
            >
              <Eye className="h-4 w-4 s-muted" />
            </button>
            {product.stock > 0 ? (
              <button
                onClick={handleAdd}
                className="px-4 py-2 rounded-xl text-white text-sm font-medium shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                style={{ backgroundColor: primaryColor }}
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">В корзину</span>
              </button>
            ) : (
              <span className="text-xs s-muted font-medium px-2">Нет в наличии</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Stories Row ─── */
function StoriesRow({ stories, primaryColor }: { stories: any[]; primaryColor: string }) {
  const [activeStory, setActiveStory] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (activeStory === null) return;
    setProgress(0);
    const start = Date.now();
    const duration = 5000;
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p);
      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        // Auto-advance or close
        if (activeStory < stories.length - 1) {
          setActiveStory(activeStory + 1);
        } else {
          setActiveStory(null);
        }
      }
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [activeStory, stories.length]);

  return (
    <>
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-thin px-0.5">
        {stories.map((story: any, i: number) => (
          <button
            key={story.id}
            onClick={() => setActiveStory(i)}
            className="shrink-0 flex flex-col items-center gap-1.5 group"
          >
            {/* Mobile: circle / Desktop: rounded square */}
            <div
              className="p-[3px] rounded-full lg:rounded-2xl"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}88, ${primaryColor}44)` }}
            >
              <div className="p-[2px] rounded-full lg:rounded-[13px] bg-white">
                <img
                  src={story.image_url}
                  alt={story.title || "Story"}
                  className="h-16 w-16 sm:h-[72px] sm:w-[72px] lg:h-24 lg:w-24 rounded-full lg:rounded-xl object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
            </div>
            {story.title && (
              <span className="text-[10px] sm:text-[11px] font-medium s-text text-center line-clamp-1 max-w-[68px] sm:max-w-[76px] lg:max-w-[96px]">
                {story.title}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Fullscreen story viewer */}
      {activeStory !== null && stories[activeStory] && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center" onClick={() => setActiveStory(null)}>
          <div className="relative w-full h-full max-w-lg mx-auto" onClick={(e) => e.stopPropagation()}>
            {/* Progress bars */}
            <div className="absolute top-3 left-3 right-3 z-20 flex gap-1.5">
              {stories.map((_: any, i: number) => (
                <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-none"
                    style={{
                      width: i < activeStory ? "100%" : i === activeStory ? `${progress * 100}%` : "0%"
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Close */}
            <button
              onClick={() => setActiveStory(null)}
              className="absolute top-8 right-3 z-20 p-2 rounded-full bg-black/30 text-white backdrop-blur-sm"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Image */}
            <img
              src={stories[activeStory].image_url}
              alt={stories[activeStory].title || "Story"}
              className="w-full h-full object-contain"
            />

            {/* Gradient overlay for text */}
            {stories[activeStory].gradient_color && (
              <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${stories[activeStory].gradient_color}, transparent 50%)` }} />
            )}

            {/* Content overlay */}
            {(stories[activeStory].title || stories[activeStory].description || stories[activeStory].button_text) && (
              <div className="absolute bottom-0 left-0 right-0 p-6 pb-10 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
                {stories[activeStory].title && (
                  <h3 className="text-white text-xl font-bold drop-shadow-lg">{stories[activeStory].title}</h3>
                )}
                {stories[activeStory].description && (
                  <p className="text-white/80 text-sm mt-1.5 line-clamp-3">{stories[activeStory].description}</p>
                )}
                {stories[activeStory].button_text && stories[activeStory].link && (
                  <a
                    href={stories[activeStory].link}
                    className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg"
                    style={{ backgroundColor: primaryColor }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {stories[activeStory].button_text}
                    <ChevronRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}

            {/* Tap zones */}
            <div className="absolute inset-0 z-10 flex">
              <button
                className="w-1/3 h-full"
                onClick={() => setActiveStory(Math.max(0, activeStory - 1))}
                aria-label="Назад"
              />
              <div className="w-1/3" />
              <button
                className="w-1/3 h-full"
                onClick={() => {
                  if (activeStory < stories.length - 1) setActiveStory(activeStory + 1);
                  else setActiveStory(null);
                }}
                aria-label="Вперёд"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function QuickViewModal({
  product,
  storeId,
  storeSlug,
  primaryColor,
  onClose,
}: {
  product: Product;
  storeId: string;
  storeSlug: string;
  primaryColor: string;
  onClose: () => void;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const { data: profile } = useProfile();
  const [qty, setQty] = useState(1);

  const handleAdd = () => {
    if (!profile || profile.role !== "customer") {
      toast.error("Войдите как покупатель");
      return;
    }
    addItem(
      {
        product_id: product.id,
        store_id: storeId,
        name: product.name,
        price: product.price,
        image: product.images[0] || null,
      },
      qty
    );
    toast.success(`${product.name} × ${qty} добавлено в корзину`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative s-card rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-white/90 hover:s-card shadow-md transition-colors backdrop-blur-sm"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Image */}
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-72 object-cover rounded-t-3xl"
          />
        ) : (
          <div className="w-full h-72 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center rounded-t-3xl">
            <Package className="h-12 w-12 text-gray-200" />
          </div>
        )}

        <div className="p-6 space-y-4">
          {/* Name + Price */}
          <div>
            <h2 className="text-xl font-bold s-text">{product.name}</h2>
            <p className="text-2xl font-bold mt-1.5" style={{ color: primaryColor }}>
              {formatPrice(product.price)}
            </p>
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-sm s-muted leading-relaxed line-clamp-4">{product.description}</p>
          )}

          {/* Stock */}
          <p className={cn(
            "text-sm font-medium",
            product.stock > 0 ? "text-emerald-600" : "s-muted"
          )}>
            {product.stock > 0 ? `В наличии: ${product.stock} шт.` : "Нет в наличии"}
          </p>

          {/* Quantity + Add to cart */}
          {product.stock > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center border s-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Уменьшить количество"
                  className="p-2.5 s-hover transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-semibold text-sm">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  aria-label="Увеличить количество"
                  className="p-2.5 s-hover transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button
                onClick={handleAdd}
                className="flex-1 h-11 text-white rounded-xl hover:opacity-90 font-semibold shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                В корзину — {formatPrice(product.price * qty)}
              </Button>
            </div>
          )}

          {/* Link to full page */}
          <a
            href={`/store/${storeSlug}/product/${product.id}`}
            className="block text-center text-sm font-medium s-muted hover:text-gray-700 transition-colors pt-1"
          >
            Подробнее о товаре →
          </a>
        </div>
      </div>
    </div>
  );
}
