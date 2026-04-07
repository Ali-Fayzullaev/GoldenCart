"use client";

import { useState } from "react";
import { Star, Check, X, MessageSquare, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useMyStore, useUpdateStore } from "@/lib/hooks/use-stores";
import {
  useStoreReviews,
  useModerateReview,
  useDeleteReview,
} from "@/lib/hooks/use-reviews";
import { toast } from "sonner";

export default function ReviewsModerationPage() {
  const { data: store } = useMyStore();
  const updateStore = useUpdateStore();
  const { data: reviews, isLoading } = useStoreReviews(store?.id);
  const moderateReview = useModerateReview();
  const deleteReview = useDeleteReview();

  const [tab, setTab] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const filtered = reviews?.filter((r) => tab === "all" || r.status === tab);

  const pendingCount = reviews?.filter((r) => r.status === "pending").length || 0;

  const handleToggle = (field: "reviews_enabled" | "reviews_moderation", value: boolean) => {
    if (!store) return;
    updateStore.mutate({ id: store.id, [field]: value } as never);
    toast.success("Настройки обновлены");
  };

  const handleModerate = (id: string, status: "approved" | "rejected") => {
    moderateReview.mutate({ id, status });
    toast.success(status === "approved" ? "Отзыв одобрен" : "Отзыв отклонён");
  };

  const handleDelete = (id: string, productId: string) => {
    if (!confirm("Удалить? Это действие нельзя отменить.")) return;
    deleteReview.mutate({ id, productId, storeId: store!.id });
    toast.success("Отзыв удалён");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Отзывы</h1>

      {/* Настройки */}
      <div className="bg-card rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5" /> Настройки отзывов
        </h2>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Отзывы включены</Label>
              <p className="text-xs text-muted-foreground">Покупатели могут оставлять отзывы</p>
            </div>
            <input
              type="checkbox"
              checked={store?.reviews_enabled ?? true}
              onChange={(e) => handleToggle("reviews_enabled", e.target.checked)}
              className="accent-amber-500 h-5 w-5"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Модерация</Label>
              <p className="text-xs text-muted-foreground">
                Отзывы публикуются только после одобрения
              </p>
            </div>
            <input
              type="checkbox"
              checked={store?.reviews_moderation ?? false}
              onChange={(e) => handleToggle("reviews_moderation", e.target.checked)}
              className="accent-amber-500 h-5 w-5"
            />
          </div>
        </div>
      </div>

      {/* Табы */}
      <div className="flex gap-2 flex-wrap">
        {(
          [
            { key: "all", label: "Все" },
            { key: "pending", label: "На модерации" },
            { key: "approved", label: "Одобренные" },
            { key: "rejected", label: "Отклонённые" },
          ] as const
        ).map((t) => (
          <Button
            key={t.key}
            variant={tab === t.key ? "default" : "outline"}
            size="sm"
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.key === "pending" && pendingCount > 0 && (
              <Badge className="ml-1.5 bg-red-500 text-white text-xs px-1.5">
                {pendingCount}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Список */}
      {!filtered?.length ? (
        <div className="text-center py-10 bg-card rounded-xl border">
          <MessageSquare className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">Нет отзывов</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((review) => (
            <div key={review.id} className="bg-card rounded-xl border p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {review.profiles?.full_name || "Покупатель"}
                    </span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className="h-3.5 w-3.5"
                          fill={s <= review.rating ? "#facc15" : "none"}
                          stroke={s <= review.rating ? "#facc15" : "#d1d5db"}
                        />
                      ))}
                    </div>
                    <Badge
                      variant={
                        review.status === "approved"
                          ? "default"
                          : review.status === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                      className="text-xs"
                    >
                      {review.status === "approved"
                        ? "Одобрен"
                        : review.status === "pending"
                          ? "На модерации"
                          : "Отклонён"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                    {new Date(review.created_at).toLocaleDateString("ru-RU")}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {review.status !== "approved" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-green-600"
                      onClick={() => handleModerate(review.id, "approved")}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  {review.status !== "rejected" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500"
                      onClick={() => handleModerate(review.id, "rejected")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground/60"
                    onClick={() => handleDelete(review.id, review.product_id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-foreground/80">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
