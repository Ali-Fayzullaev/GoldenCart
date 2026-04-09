"use client";

import { use, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStoreBySlug } from "@/lib/hooks/use-stores";
import { useProduct } from "@/lib/hooks/use-products";
import { useCartStore } from "@/lib/store/cart-store";
import { useViewHistoryStore } from "@/lib/store/view-history-store";
import { useProfile } from "@/lib/hooks/use-profile";
import { useProductReviews, useCreateReview, useDeleteReview } from "@/lib/hooks/use-reviews";
import { formatPrice } from "@/lib/helpers";
import { toast } from "sonner";
import { useState } from "react";
import type { ReviewWithProfile } from "@/lib/types/database";

export default function ProductDetailClient({
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
  const touchStartRef = useRef<number | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({});

  const { data: reviews } = useProductReviews(id);
  const createReview = useCreateReview();
  const deleteReview = useDeleteReview();

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  const addView = useViewHistoryStore((s) => s.addView);

  // Записываем просмотр товара
  useEffect(() => {
    if (product) {
      addView({
        product_id: product.id,
        store_id: product.store_id,
        name: product.name,
        price: product.price,
        image: product.images[0] || null,
      });
    }
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const primaryColor = store?.store_settings?.primary_color || "#f59e0b";

  const avgRating =
    reviews && reviews.length > 0
      ? Math.round(
          (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10
        ) / 10
      : 0;

  const handleSubmitReview = async () => {
    if (!profile || profile.role !== "customer") {
      toast.error("Войдите как покупатель, чтобы оставить отзыв");
      return;
    }
    if (reviewComment.trim().length < 3) {
      toast.error("Комментарий должен быть минимум 3 символа");
      return;
    }
    try {
      await createReview.mutateAsync({
        product_id: id,
        store_id: product!.store_id,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviewComment("");
      setReviewRating(5);
      toast.success("Отзыв опубликован!");
    } catch {
      toast.error("Не удалось отправить отзыв");
    }
  };

  if (isLoading) {
    return (
      <div className="py-4 sm:py-6 space-y-6">
        <div className="grid md:grid-cols-2 gap-5 sm:gap-8 md:gap-10">
          {/* Image skeleton */}
          <div className="space-y-3">
            <div className="aspect-square rounded-2xl bg-gray-100 animate-pulse" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 w-14 sm:h-18 sm:w-18 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          </div>
          {/* Info skeleton */}
          <div className="space-y-4 pt-2">
            <div className="h-7 bg-gray-100 rounded-lg w-3/4 animate-pulse" />
            <div className="h-9 bg-gray-100 rounded-lg w-1/3 animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" />
            </div>
            <div className="h-12 bg-gray-100 rounded-xl w-full animate-pulse mt-4" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <ShoppingBag className="h-16 w-16 text-gray-200 mx-auto mb-4" />
        <h3 className="text-lg font-semibold s-text mb-1">Товар не найден</h3>
        <p className="text-gray-400 text-sm">Возможно, он был удалён или скрыт</p>
      </div>
    );
  }

  // Вычисляем эффективную цену на основе выбранных вариантов
  const getEffectivePrice = (): number => {
    if (!product) return 0;
    for (const variant of product.variants || []) {
      const sel = selectedVariants[variant.name];
      if (sel && variant.prices?.[sel] != null) {
        return variant.prices[sel];
      }
    }
    return product.price;
  };

  const getEffectiveComparePrice = (): number | null => {
    if (!product) return null;
    for (const variant of product.variants || []) {
      const sel = selectedVariants[variant.name];
      if (sel && variant.compare_prices?.[sel] != null) {
        return variant.compare_prices[sel];
      }
    }
    return product.compare_price ?? null;
  };

  const effectivePrice = getEffectivePrice();
  const effectiveComparePrice = getEffectiveComparePrice();

  const handleAdd = () => {
    if (!profile || profile.role !== "customer") {
      toast.error("Войдите как покупатель");
      return;
    }
    // Проверяем что все варианты выбраны
    if (product.variants && product.variants.length > 0) {
      const missing = product.variants.filter(
        (v) => !selectedVariants[v.name]
      );
      if (missing.length > 0) {
        toast.error(`Выберите: ${missing.map((v) => v.name).join(", ")}`);
        return;
      }
    }
    const variantSuffix =
      Object.keys(selectedVariants).length > 0
        ? ` (${Object.values(selectedVariants).join(", ")})`
        : "";
    addItem(
      {
        product_id:
          product.id +
          (Object.keys(selectedVariants).length > 0
            ? ":" + Object.values(selectedVariants).sort().join(",")
            : ""),
        store_id: product.store_id,
        name: product.name + variantSuffix,
        price: effectivePrice,
        image: product.images[0] || null,
      },
      quantity
    );
    toast.success("Добавлено в корзину");
  };

  return (
    <div className="max-w-5xl mx-auto py-4 sm:py-6 px-0 pb-20 md:pb-6">
      <div className="grid md:grid-cols-2 gap-5 sm:gap-8 md:gap-10">
        {/* Images */}
        <div className="space-y-3">
          {product.images.length > 0 ? (
            <>
              <div className="rounded-2xl overflow-hidden s-card shadow-sm border s-border">
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full aspect-square object-cover"
                />
              </div>
              {product.images.length > 1 && (
                <div className="flex gap-2 sm:gap-2.5 overflow-x-auto pb-1">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`h-14 w-14 sm:h-18 sm:w-18 shrink-0 rounded-xl border-2 overflow-hidden transition-all ${
                        i === selectedImage ? "ring-2 ring-offset-2 shadow-md" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                      style={i === selectedImage ? { borderColor: primaryColor } : {}}
                    >
                      <img src={img} alt={`${product.name} — фото ${i + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center">
              <ShoppingBag className="h-20 w-20 text-gray-200" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            <h1 className="text-3xl font-bold s-text">{product.name}</h1>
            <div className="flex items-baseline gap-3 mt-2">
              <p className="text-3xl font-bold" style={{ color: primaryColor }}>
                {formatPrice(effectivePrice)}
              </p>
              {effectiveComparePrice != null && effectiveComparePrice > effectivePrice && (
                <p className="text-lg text-gray-400 line-through">
                  {formatPrice(effectiveComparePrice)}
                </p>
              )}
            </div>
            {product.sku && (
              <p className="text-xs text-gray-400 mt-1 font-mono">Артикул: {product.sku}</p>
            )}
          </div>

          {product.stock > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                В наличии: {product.stock} шт.
              </span>
              {product.weight && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm">
                  {product.weight}
                </span>
              )}
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-sm font-medium">
              Нет в наличии
            </span>
          )}

          <p className="text-gray-500 leading-relaxed whitespace-pre-line">{product.description}</p>

          {/* Варианты товара */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3">
              {product.variants.map((variant) => (
                <div key={variant.name} className="space-y-1.5">
                  <p className="text-sm font-medium">
                    {variant.name}
                    {selectedVariants[variant.name] && (
                      <span className="text-gray-400 font-normal">
                        : {selectedVariants[variant.name]}
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {variant.values.map((val) => {
                      const isSelected = selectedVariants[variant.name] === val;
                      const variantPrice = variant.prices?.[val];
                      return (
                        <button
                          key={val}
                          onClick={() =>
                            setSelectedVariants((prev) => ({
                              ...prev,
                              [variant.name]: val,
                            }))
                          }
                          className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                            isSelected
                              ? "text-white border-transparent shadow-md"
                              : "border-gray-200 hover:border-gray-400 s-hover"
                          }`}
                          style={isSelected ? { backgroundColor: primaryColor } : {}}
                        >
                          {val}
                          {variantPrice != null && (
                            <span className="ml-1 text-xs opacity-80">
                              {formatPrice(variantPrice)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Average rating */}
          {reviews && reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className="h-5 w-5"
                    fill={s <= Math.round(avgRating) ? "#facc15" : "none"}
                    stroke={s <= Math.round(avgRating) ? "#facc15" : "#d1d5db"}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {avgRating} ({reviews.length}{" "}
                {reviews.length === 1
                  ? "отзыв"
                  : reviews.length < 5
                  ? "отзыва"
                  : "отзывов"}
                )
              </span>
            </div>
          )}

          {product.stock > 0 && (
            <div className="hidden md:flex items-center gap-4 pt-2">
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label="Уменьшить количество"
                  className="p-3 s-hover transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-5 font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  aria-label="Увеличить количество"
                  className="p-3 s-hover transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <Button
                onClick={handleAdd}
                size="lg"
                style={{ backgroundColor: primaryColor }}
                className="text-white hover:opacity-90 flex-1 h-12 rounded-xl text-base font-semibold shadow-md"
              >
                В корзину — {formatPrice(effectivePrice * quantity)}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Отзывы */}
      <div className="mt-12 border-t s-border pt-10">
        <h2 className="text-2xl font-bold s-text mb-6">
          Отзывы{" "}
          {reviews && reviews.length > 0 && (
            <span className="text-gray-300 text-lg font-normal">
              ({reviews.length})
            </span>
          )}
        </h2>

        {/* Форма отзыва */}
        {profile?.role === "customer" && (
          <div className="s-card border s-border rounded-2xl p-5 mb-8 space-y-4 shadow-sm">
            <p className="font-semibold s-text">Оставьте отзыв</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setReviewRating(s)}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  <Star
                    className="h-7 w-7 transition-colors"
                    fill={
                      s <= (hoverRating || reviewRating) ? "#facc15" : "none"
                    }
                    stroke={
                      s <= (hoverRating || reviewRating) ? "#facc15" : "#d1d5db"
                    }
                  />
                </button>
              ))}
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Напишите ваш отзыв..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 transition-shadow"
            />
            <Button
              onClick={handleSubmitReview}
              disabled={createReview.isPending}
              style={{ backgroundColor: primaryColor }}
              className="text-white hover:opacity-90"
            >
              {createReview.isPending ? "Отправка..." : "Отправить отзыв"}
            </Button>
          </div>
        )}

  
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.description,
            image: product.images,
            offers: {
              "@type": "Offer",
              price: product.price,
              priceCurrency: "RUB",
              availability: product.stock > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            },
            ...(avgRating > 0
              ? {
                  aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: avgRating,
                    reviewCount: reviews?.length || 0,
                  },
                }
              : {}),
          }),
        }}
      />

      {/* Список отзывов */}
        {!reviews || reviews.length === 0 ? (
          <p className="text-gray-400 text-center py-10">
            Пока нет отзывов. Будьте первым!
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="s-card border s-border rounded-2xl p-5 space-y-2.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className="h-4 w-4"
                          fill={s <= review.rating ? "#facc15" : "none"}
                          stroke={s <= review.rating ? "#facc15" : "#d1d5db"}
                        />
                      ))}
                    </div>
                    <span className="font-medium text-sm">
                      {review.profiles?.full_name || "Покупатель"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString("ru-RU")}
                    </span>
                    {(profile?.id === review.customer_id ||
                      profile?.role === "seller") && (
                      <button
                        onClick={() =>
                          deleteReview.mutate({
                            id: review.id,
                            productId: review.product_id,
                            storeId: review.store_id,
                          })
                        }
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky add-to-cart bar on mobile */}
      {product.stock > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden s-card border-t s-border px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]" style={{ backgroundColor: 'var(--s-bg, #fff)' }}>
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden shrink-0">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2.5 s-hover transition-colors"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="px-3 font-semibold text-sm">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="p-2.5 s-hover transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <Button
              onClick={handleAdd}
              style={{ backgroundColor: primaryColor }}
              className="text-white hover:opacity-90 flex-1 h-11 rounded-xl text-sm font-semibold shadow-md"
            >
              В корзину — {formatPrice(effectivePrice * quantity)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
