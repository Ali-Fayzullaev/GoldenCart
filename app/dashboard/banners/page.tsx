"use client";

import { useState, useRef } from "react";
import {
  ImageIcon,
  Plus,
  Trash2,
  Loader2,
  Link2,
  GripVertical,
  Eye,
  EyeOff,
  Sparkles,
  Film,
  Layers,
  Calendar,
  Type,
  Palette,
  ExternalLink,
  Clock,
  X,
  Upload as UploadIcon,
  MousePointerClick,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMyStore } from "@/lib/hooks/use-stores";
import { useUpload } from "@/lib/hooks/use-upload";
import {
  useStoreBanners,
  useCreateStoreBanner,
  useUpdateStoreBanner,
  useDeleteStoreBanner,
} from "@/lib/hooks/use-store-banners";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

type BannerType = "slider" | "story";
type EditingBanner = {
  id: string;
  title: string;
  description: string;
  link: string;
  button_text: string;
  gradient_color: string;
  banner_type: BannerType;
  expires_at: string;
} | null;

const GRADIENT_PRESETS = [
  { color: "", label: "Без" },
  { color: "rgba(0,0,0,0.4)", label: "Тёмный" },
  { color: "rgba(0,0,0,0.6)", label: "Тёмный+" },
  { color: "rgba(99,102,241,0.5)", label: "Индиго" },
  { color: "rgba(244,63,94,0.4)", label: "Розовый" },
  { color: "rgba(234,179,8,0.3)", label: "Золото" },
  { color: "rgba(16,185,129,0.4)", label: "Зелёный" },
];

export default function BannersPage() {
  const { data: store, isLoading: storeLoading } = useMyStore();
  const { data: banners, isLoading: bannersLoading } = useStoreBanners(store?.id);
  const createBanner = useCreateStoreBanner();
  const updateBanner = useUpdateStoreBanner();
  const deleteBanner = useDeleteStoreBanner();
  const { upload, uploading } = useUpload();
  const [activeTab, setActiveTab] = useState<BannerType>("slider");
  const [editing, setEditing] = useState<EditingBanner>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (storeLoading || bannersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Сначала создайте магазин</p>
      </div>
    );
  }

  const sliderBanners = banners?.filter((b) => (b as any).banner_type !== "story") || [];
  const storyBanners = banners?.filter((b) => (b as any).banner_type === "story") || [];
  const activeBanners = activeTab === "slider" ? sliderBanners : storyBanners;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Макс. размер файла: 5 МБ");
      return;
    }
    try {
      const url = await upload("products", store.id, file);
      await createBanner.mutateAsync({
        store_id: store.id,
        image_url: url,
        sort_order: (banners?.length || 0) + 1,
        banner_type: activeTab,
      } as any);
      toast.success(activeTab === "story" ? "Сториз добавлена" : "Баннер добавлен");
      setShowAddForm(false);
    } catch {
      toast.error("Ошибка загрузки");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить? Это действие нельзя отменить.")) return;
    try {
      await deleteBanner.mutateAsync(id);
      toast.success("Удалено");
      if (editing?.id === id) setEditing(null);
    } catch {
      toast.error("Ошибка");
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await updateBanner.mutateAsync({ id, is_active: !current } as any);
    } catch {
      toast.error("Ошибка");
    }
  };

  const handleSaveEditing = async () => {
    if (!editing) return;
    try {
      await updateBanner.mutateAsync({
        id: editing.id,
        title: editing.title,
        description: editing.description,
        link: editing.link,
        button_text: editing.button_text,
        gradient_color: editing.gradient_color,
        expires_at: editing.expires_at || null,
      } as any);
      toast.success("Сохранено");
      setEditing(null);
    } catch {
      toast.error("Ошибка сохранения");
    }
  };

  const startEditing = (banner: any) => {
    setEditing({
      id: banner.id,
      title: banner.title || "",
      description: banner.description || "",
      link: banner.link || "",
      button_text: banner.button_text || "",
      gradient_color: banner.gradient_color || "",
      banner_type: banner.banner_type || "slider",
      expires_at: banner.expires_at ? banner.expires_at.slice(0, 16) : "",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Баннеры и Сториз</h1>
          <p className="text-muted-foreground mt-1 text-sm">Управляйте промо-контентом вашего магазина</p>
        </div>
        <Button
          onClick={() => { setShowAddForm(true); setEditing(null); }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Добавить
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("slider")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
            activeTab === "slider"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Layers className="h-4 w-4" />
          Баннеры-слайдер
          {sliderBanners.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
              {sliderBanners.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("story")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
            activeTab === "story"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Film className="h-4 w-4" />
          Сториз
          {storyBanners.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-600 text-[10px] font-bold">
              {storyBanners.length}
            </span>
          )}
        </button>
      </div>

      {/* Info cards */}
      {activeTab === "slider" ? (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30 p-4 flex items-start gap-3">
          <Layers className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-200">Баннеры отображаются как слайдер вверху каталога</p>
            <p className="text-blue-600/70 dark:text-blue-400/70 mt-0.5">Рекомендуемый размер: 1200×400px. Добавьте заголовок, описание и ссылку для максимального эффекта</p>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-950/20 dark:to-fuchsia-950/20 rounded-xl border border-violet-100 dark:border-violet-900/30 p-4 flex items-start gap-3">
          <Film className="h-5 w-5 text-violet-500 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-violet-900 dark:text-violet-200">Сториз — круглые иконки над каталогом как в Instagram</p>
            <p className="text-violet-600/70 dark:text-violet-400/70 mt-0.5">Используйте для акций, новинок и событий. Рекомендуемый размер: 1080×1920px (вертикальный). Можно задать срок истечения</p>
          </div>
        </div>
      )}

      {/* Upload area */}
      {showAddForm && (
        <div className="bg-card rounded-xl border-2 border-dashed border-primary/30 p-8 text-center space-y-4">
          <div className="flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              {activeTab === "story" ? (
                <Film className="h-7 w-7 text-primary" />
              ) : (
                <ImageIcon className="h-7 w-7 text-primary" />
              )}
            </div>
            <div>
              <p className="font-semibold text-lg">
                {activeTab === "story" ? "Добавить сториз" : "Добавить баннер"}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {activeTab === "story"
                  ? "Загрузите вертикальное изображение (1080×1920px)"
                  : "Загрузите горизонтальное изображение (1200×400px)"}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-sm">
              <UploadIcon className="h-4 w-4" />
              {uploading ? "Загрузка..." : "Выбрать файл"}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
            <Button variant="outline" onClick={() => setShowAddForm(false)} size="sm">
              Отмена
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">PNG, JPG, WebP. Макс. 5 МБ</p>
        </div>
      )}

      {/* Banner / Story list */}
      {!activeBanners.length && !showAddForm ? (
        <div className="text-center py-16 bg-card rounded-xl border">
          {activeTab === "story" ? (
            <Film className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          ) : (
            <ImageIcon className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          )}
          <h3 className="text-lg font-semibold mb-1">
            {activeTab === "story" ? "Нет сториз" : "Нет баннеров"}
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            {activeTab === "story"
              ? "Создайте свою первую сториз для акций и анонсов"
              : "Добавьте баннеры для привлечения внимания покупателей"}
          </p>
          <Button onClick={() => setShowAddForm(true)} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            {activeTab === "story" ? "Создать сториз" : "Добавить баннер"}
          </Button>
        </div>
      ) : (
        <div className={cn(
          "gap-4",
          activeTab === "story" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" : "space-y-4"
        )}>
          {activeBanners.map((banner: any) => (
            activeTab === "story" ? (
              /* Story card */
              <div key={banner.id} className="group relative">
                <div
                  className={cn(
                    "relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all",
                    editing?.id === banner.id ? "border-violet-500 shadow-lg" : "border-transparent hover:border-violet-200",
                    !banner.is_active && "opacity-50"
                  )}
                  onClick={() => startEditing(banner)}
                >
                  <div className="aspect-[9/16] relative">
                    <img
                      src={banner.image_url}
                      alt={banner.title || "Story"}
                      className="w-full h-full object-cover"
                    />
                    {(banner.gradient_color) && (
                      <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${banner.gradient_color}, transparent 60%)` }} />
                    )}
                    {banner.title && (
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-xs font-semibold line-clamp-2 drop-shadow-lg">{banner.title}</p>
                      </div>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleActive(banner.id, banner.is_active); }}
                      className="p-1.5 rounded-lg bg-white/90 shadow-sm backdrop-blur-sm"
                    >
                      {banner.is_active ? <Eye className="h-3 w-3 text-green-600" /> : <EyeOff className="h-3 w-3 text-gray-400" />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(banner.id); }}
                      className="p-1.5 rounded-lg bg-white/90 shadow-sm backdrop-blur-sm"
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </button>
                  </div>
                  {/* Expiry badge */}
                  {banner.expires_at && (
                    <div className="absolute top-2 left-2">
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/50 text-white text-[9px] font-medium backdrop-blur-sm">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(banner.expires_at).toLocaleDateString("ru")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Slider banner card */
              <div
                key={banner.id}
                className={cn(
                  "bg-card rounded-xl border overflow-hidden transition-all",
                  editing?.id === banner.id ? "border-primary shadow-lg ring-2 ring-primary/20" : "hover:shadow-md",
                  !banner.is_active && "opacity-60"
                )}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Preview */}
                  <div
                    className="relative w-full sm:w-64 shrink-0 cursor-pointer group/img"
                    onClick={() => startEditing(banner)}
                  >
                    <img
                      src={banner.image_url}
                      alt={banner.title || "Banner"}
                      className="w-full h-40 object-cover"
                    />
                    {banner.gradient_color && (
                      <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${banner.gradient_color}, transparent 70%)` }} />
                    )}
                    {banner.title && (
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent">
                        <p className="text-white text-sm font-semibold line-clamp-1">{banner.title}</p>
                        {banner.description && (
                          <p className="text-white/70 text-xs line-clamp-1 mt-0.5">{banner.description}</p>
                        )}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors flex items-center justify-center">
                      <span className="text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity backdrop-blur-sm">
                        Редактировать
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm truncate">
                          {banner.title || "Без заголовка"}
                        </h3>
                        <span className={cn(
                          "shrink-0 px-2 py-0.5 rounded-md text-[10px] font-semibold",
                          banner.is_active
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                        )}>
                          {banner.is_active ? "Активен" : "Скрыт"}
                        </span>
                      </div>
                      {banner.link && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          {banner.link}
                        </p>
                      )}
                      {banner.button_text && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MousePointerClick className="h-3 w-3 shrink-0" />
                          Кнопка: «{banner.button_text}»
                        </p>
                      )}
                      {banner.expires_at && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3 shrink-0" />
                          До {new Date(banner.expires_at).toLocaleDateString("ru")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => startEditing(banner)}
                      >
                        Настроить
                      </Button>
                      <button
                        onClick={() => handleToggleActive(banner.id, banner.is_active)}
                        className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                        title={banner.is_active ? "Скрыть" : "Показать"}
                      >
                        {banner.is_active ? <Eye className="h-4 w-4 text-green-500" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {/* Edit panel (drawer-like) */}
      {editing && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setEditing(null)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-background border-l shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="sticky top-0 z-10 bg-background border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Настройка {editing.banner_type === "story" ? "сториз" : "баннера"}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Заполните поля для отображения на витрине</p>
              </div>
              <button onClick={() => setEditing(null)} className="p-2 rounded-lg hover:bg-accent">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Title */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Type className="h-3.5 w-3.5 text-muted-foreground" />
                  Заголовок
                </Label>
                <Input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder="Летняя распродажа — скидки до 50%"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Type className="h-3.5 w-3.5 text-muted-foreground" />
                  Описание
                </Label>
                <Textarea
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="Подробности акции или короткое описание..."
                  rows={3}
                />
              </div>

              {/* Link */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Ссылка (при нажатии)
                </Label>
                <Input
                  value={editing.link}
                  onChange={(e) => setEditing({ ...editing, link: e.target.value })}
                  placeholder="/store/my-shop/product/... или https://..."
                />
                <p className="text-[11px] text-muted-foreground">Покупатель перейдёт по этой ссылке при клике</p>
              </div>

              {/* Button text */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <MousePointerClick className="h-3.5 w-3.5 text-muted-foreground" />
                  Текст кнопки
                </Label>
                <Input
                  value={editing.button_text}
                  onChange={(e) => setEditing({ ...editing, button_text: e.target.value })}
                  placeholder="Подробнее, Купить, Перейти..."
                />
                <p className="text-[11px] text-muted-foreground">Кнопка отображается поверх баннера (если заполнено)</p>
              </div>

              {/* Gradient overlay */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                  Затемнение / Оверлей
                </Label>
                <div className="flex flex-wrap gap-2">
                  {GRADIENT_PRESETS.map((g) => (
                    <button
                      key={g.color}
                      onClick={() => setEditing({ ...editing, gradient_color: g.color })}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                        editing.gradient_color === g.color
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      {g.color && (
                        <span className="inline-block w-3 h-3 rounded-full mr-1.5 align-middle border" style={{ backgroundColor: g.color }} />
                      )}
                      {g.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">Делает текст более читаемым поверх светлых изображений</p>
              </div>

              {/* Expiry date */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Срок действия
                </Label>
                <Input
                  type="datetime-local"
                  value={editing.expires_at}
                  onChange={(e) => setEditing({ ...editing, expires_at: e.target.value })}
                />
                <p className="text-[11px] text-muted-foreground">Баннер автоматически скроется после указанной даты (опционально)</p>
              </div>

              {/* Save */}
              <div className="flex gap-3 pt-2">
                <Button onClick={handleSaveEditing} className="flex-1 gap-2" disabled={updateBanner.isPending}>
                  {updateBanner.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Сохранить
                </Button>
                <Button variant="outline" onClick={() => setEditing(null)}>
                  Отмена
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
