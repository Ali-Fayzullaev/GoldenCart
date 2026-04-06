"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStoreBySlug } from "@/lib/hooks/use-stores";
import { useProduct } from "@/lib/hooks/use-products";
import { useCartStore } from "@/lib/store/cart-store";
import { useProfile } from "@/lib/hooks/use-profile";
import { useProductReviews, useCreateReview, useDeleteReview } from "@/lib/hooks/use-reviews";
import { formatPrice } from "@/lib/helpers";
import { toast } from "sonner";
import { useState } from "react";
import type { ReviewWithProfile } from "@/lib/types/database";

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
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({});

  const { data: reviews } = useProductReviews(id);
  const createReview = useCreateReview();
  const deleteReview = useDeleteReview();

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

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
                      const isSelected =
                        selectedVariants[variant.name] === val;
                      return (
                        <button
                          key={val}
                          onClick={() =>
                            setSelectedVariants((prev) => ({
                              ...prev,
                              [variant.name]: val,
                            }))
                          }
                          className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                            isSelected
                              ? "text-white border-transparent"
                              : "hover:border-gray-400"
                          }`}
                          style={
                            isSelected
                              ? { backgroundColor: primaryColor }
                              : {}
                          }
                        >
                          {val}
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

      {/* Отзывы */}
      <div className="mt-10 border-t pt-8">
        <h2 className="text-2xl font-bold mb-6">
          Отзывы{" "}
          {reviews && reviews.length > 0 && (
            <span className="text-gray-400 text-lg font-normal">
              ({reviews.length})
            </span>
          )}
        </h2>

        {/* Форма отзыва */}
        {profile?.role === "customer" && (
          <div className="border rounded-xl p-4 mb-6 space-y-3">
            <p className="font-medium">Оставьте отзыв</p>
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
              className="w-full border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
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

        {/* Список отзывов */}
        {!reviews || reviews.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            Пока нет отзывов. Будьте первым!
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="border rounded-xl p-4 space-y-2"
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
                <p className="text-sm text-gray-600">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
