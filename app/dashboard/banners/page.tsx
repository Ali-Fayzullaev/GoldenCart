"use client";

import { useState } from "react";
import {
  ImageIcon,
  Plus,
  Trash2,
  Loader2,
  Link2,
  GripVertical,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMyStore } from "@/lib/hooks/use-stores";
import { useUpload } from "@/lib/hooks/use-upload";
import {
  useStoreBanners,
  useCreateStoreBanner,
  useUpdateStoreBanner,
  useDeleteStoreBanner,
} from "@/lib/hooks/use-store-banners";
import { toast } from "sonner";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export default function BannersPage() {
  const { data: store, isLoading: storeLoading } = useMyStore();
  const { data: banners, isLoading: bannersLoading } = useStoreBanners(
    store?.id
  );
  const createBanner = useCreateStoreBanner();
  const updateBanner = useUpdateStoreBanner();
  const deleteBanner = useDeleteStoreBanner();
  const { upload, uploading } = useUpload();
  const [imageUrl, setImageUrl] = useState("");

  if (storeLoading || bannersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Сначала создайте магазин</p>
      </div>
    );
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Макс. размер файла: 2 МБ");
      return;
    }
    try {
      const url = await upload("products", store.id, file);
      await createBanner.mutateAsync({
        store_id: store.id,
        image_url: url,
        sort_order: (banners?.length || 0) + 1,
      });
      toast.success("Баннер добавлен");
    } catch {
      toast.error("Ошибка загрузки");
    }
  };

  const handleUrlAdd = async () => {
    const url = imageUrl.trim();
    if (!url) return;
    try {
      new URL(url);
    } catch {
      toast.error("Некорректный URL");
      return;
    }
    try {
      await createBanner.mutateAsync({
        store_id: store.id,
        image_url: url,
        sort_order: (banners?.length || 0) + 1,
      });
      setImageUrl("");
      toast.success("Баннер добавлен");
    } catch {
      toast.error("Ошибка");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBanner.mutateAsync(id);
      toast.success("Баннер удалён");
    } catch {
      toast.error("Ошибка");
    }
  };

  const handleUpdateField = async (
    id: string,
    field: "link" | "title" | "is_active",
    value: string | boolean
  ) => {
    try {
      await updateBanner.mutateAsync({ id, [field]: value });
    } catch {
      toast.error("Ошибка");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Баннеры / Слайдер</h1>

      {/* Добавление */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold">Добавить баннер</h2>

        <div className="flex gap-3">
          <label className="inline-flex items-center gap-2 cursor-pointer rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
            <ImageIcon className="h-4 w-4" />
            {uploading ? "Загрузка..." : "Загрузить файл"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="https://example.com/banner.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="pl-8"
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), handleUrlAdd())
              }
            />
          </div>
          <Button
            variant="outline"
            onClick={handleUrlAdd}
            disabled={createBanner.isPending}
          >
            Добавить URL
          </Button>
        </div>

        <p className="text-xs text-gray-400">
          Рекомендуемый размер: 1200×400px. Макс. 2 МБ
        </p>
      </div>

      {/* Список баннеров */}
      {!banners?.length ? (
        <div className="text-center py-10 bg-white rounded-xl border">
          <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Баннеров пока нет</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="bg-white rounded-xl border p-4 space-y-3"
            >
              <div className="flex items-start gap-4">
                <GripVertical className="h-5 w-5 text-gray-300 mt-1 shrink-0" />
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="h-20 w-40 object-cover rounded-lg shrink-0"
                />
                <div className="flex-1 space-y-2">
                  <div>
                    <Label className="text-xs text-gray-500">Заголовок</Label>
                    <Input
                      defaultValue={banner.title ?? ""}
                      placeholder="Акция!"
                      className="h-8 text-sm"
                      onBlur={(e) =>
                        handleUpdateField(banner.id, "title", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Ссылка</Label>
                    <Input
                      defaultValue={banner.link ?? ""}
                      placeholder="/store/slug/product/..."
                      className="h-8 text-sm"
                      onBlur={(e) =>
                        handleUpdateField(banner.id, "link", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() =>
                      handleUpdateField(
                        banner.id,
                        "is_active",
                        !banner.is_active
                      )
                    }
                    className="p-1"
                  >
                    {banner.is_active ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500"
                    onClick={() => handleDelete(banner.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
