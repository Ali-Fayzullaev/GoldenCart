"use client";

import { useState, useEffect } from "react";
import { Loader2, Upload as UploadIcon, Check, Sparkles, Globe, LayoutGrid, Store, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMyStore, useUpdateStoreSettings } from "@/lib/hooks/use-stores";
import { useUpload } from "@/lib/hooks/use-upload";
import { FONTS } from "@/lib/helpers";
import { toast } from "sonner";

// Готовые дизайн-пресеты
const DESIGN_PRESETS = [
  {
    id: "minimal-light",
    name: "Минимализм",
    description: "Чистый и лёгкий",
    primary_color: "#18181b",
    secondary_color: "#fafafa",
    accent_color: "#18181b",
    background_color: "#ffffff",
    text_color: "#09090b",
    font: "Inter",
    preview: { bg: "#ffffff", header: "#fafafa", accent: "#18181b" },
  },
  {
    id: "ocean-breeze",
    name: "Океан",
    description: "Спокойный и свежий",
    primary_color: "#0ea5e9",
    secondary_color: "#0c4a6e",
    accent_color: "#06b6d4",
    background_color: "#f0f9ff",
    text_color: "#0c4a6e",
    font: "Inter",
    preview: { bg: "#f0f9ff", header: "#0c4a6e", accent: "#0ea5e9" },
  },
  {
    id: "sunset-warm",
    name: "Закат",
    description: "Тёплый и уютный",
    primary_color: "#f97316",
    secondary_color: "#431407",
    accent_color: "#fb923c",
    background_color: "#fff7ed",
    text_color: "#431407",
    font: "Nunito",
    preview: { bg: "#fff7ed", header: "#431407", accent: "#f97316" },
  },
  {
    id: "forest-green",
    name: "Лес",
    description: "Природный и экологичный",
    primary_color: "#16a34a",
    secondary_color: "#14532d",
    accent_color: "#22c55e",
    background_color: "#f0fdf4",
    text_color: "#14532d",
    font: "Inter",
    preview: { bg: "#f0fdf4", header: "#14532d", accent: "#16a34a" },
  },
  {
    id: "royal-purple",
    name: "Роял",
    description: "Премиальный и элегантный",
    primary_color: "#9333ea",
    secondary_color: "#3b0764",
    accent_color: "#a855f7",
    background_color: "#faf5ff",
    text_color: "#3b0764",
    font: "Playfair Display",
    preview: { bg: "#faf5ff", header: "#3b0764", accent: "#9333ea" },
  },
  {
    id: "dark-mode",
    name: "Тёмная тема",
    description: "Стильный и современный",
    primary_color: "#f59e0b",
    secondary_color: "#111827",
    accent_color: "#fbbf24",
    background_color: "#0f172a",
    text_color: "#f1f5f9",
    font: "Inter",
    preview: { bg: "#0f172a", header: "#111827", accent: "#f59e0b" },
  },
  {
    id: "rose-gold",
    name: "Розовое золото",
    description: "Нежный и женственный",
    primary_color: "#e11d48",
    secondary_color: "#4c0519",
    accent_color: "#fb7185",
    background_color: "#fff1f2",
    text_color: "#4c0519",
    font: "Nunito",
    preview: { bg: "#fff1f2", header: "#4c0519", accent: "#e11d48" },
  },
  {
    id: "neon-cyber",
    name: "Неон",
    description: "Яркий и футуристичный",
    primary_color: "#06b6d4",
    secondary_color: "#0a0a0a",
    accent_color: "#22d3ee",
    background_color: "#18181b",
    text_color: "#e4e4e7",
    font: "Roboto",
    preview: { bg: "#18181b", header: "#0a0a0a", accent: "#06b6d4" },
  },
  {
    id: "coffee-shop",
    name: "Кофейня",
    description: "Тёплый и крафтовый",
    primary_color: "#92400e",
    secondary_color: "#451a03",
    accent_color: "#d97706",
    background_color: "#fffbeb",
    text_color: "#451a03",
    font: "Playfair Display",
    preview: { bg: "#fffbeb", header: "#451a03", accent: "#92400e" },
  },
  {
    id: "arctic-blue",
    name: "Арктика",
    description: "Холодный и чистый",
    primary_color: "#2563eb",
    secondary_color: "#1e3a5f",
    accent_color: "#3b82f6",
    background_color: "#eff6ff",
    text_color: "#1e3a5f",
    font: "Roboto",
    preview: { bg: "#eff6ff", header: "#1e3a5f", accent: "#2563eb" },
  },
];

export default function DesignPage() {
  const { data: store, isLoading } = useMyStore();
  const updateSettings = useUpdateStoreSettings();
  const { upload, uploading } = useUpload();
  const settings = store?.store_settings;

  const [primaryColor, setPrimaryColor] = useState("#f59e0b");
  const [secondaryColor, setSecondaryColor] = useState("#1f2937");
  const [accentColor, setAccentColor] = useState("#10b981");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#111827");
  const [font, setFont] = useState("Inter");
  const [welcomeText, setWelcomeText] = useState("Добро пожаловать в наш магазин!");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [instagramUrl, setInstagramUrl] = useState("");
  const [telegramUrl, setTelegramUrl] = useState("");
  const [vkUrl, setVkUrl] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [cardStyle, setCardStyle] = useState("standard");

  useEffect(() => {
    if (settings) {
      setPrimaryColor(settings.primary_color);
      setSecondaryColor(settings.secondary_color);
      setAccentColor(settings.accent_color);
      setBackgroundColor(settings.background_color);
      setTextColor(settings.text_color);
      setFont(settings.font);
      setWelcomeText(settings.welcome_text);
      setLogoUrl(settings.logo_url);
      setBannerUrl(settings.banner_url);
      setInstagramUrl(settings.instagram_url || "");
      setTelegramUrl(settings.telegram_url || "");
      setVkUrl(settings.vk_url || "");
      setWhatsappUrl(settings.whatsapp_url || "");
      setCardStyle((settings as any).card_style || "standard");
    }
  }, [settings]);

  const applyPreset = (preset: typeof DESIGN_PRESETS[number]) => {
    setPrimaryColor(preset.primary_color);
    setSecondaryColor(preset.secondary_color);
    setAccentColor(preset.accent_color);
    setBackgroundColor(preset.background_color);
    setTextColor(preset.text_color);
    setFont(preset.font);
    setActivePreset(preset.id);
    toast.success(`Тема «${preset.name}» применена`);
  };

  const handleSave = async () => {
    if (!store) return;
    try {
      await updateSettings.mutateAsync({
        storeId: store.id,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        accent_color: accentColor,
        background_color: backgroundColor,
        text_color: textColor,
        font,
        welcome_text: welcomeText,
        logo_url: logoUrl,
        banner_url: bannerUrl,
        instagram_url: instagramUrl,
        telegram_url: telegramUrl,
        vk_url: vkUrl,
        whatsapp_url: whatsappUrl,
        card_style: cardStyle,
      } as any);
      toast.success("Дизайн сохранён");
    } catch {
      toast.error("Ошибка сохранения");
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    bucket: string,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file || !store) return;
    try {
      const url = await upload(bucket, store.id, file);
      setter(url);
      toast.success("Файл загружен");
    } catch {
      toast.error("Ошибка загрузки");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
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

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Settings */}
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Дизайн магазина</h1>

        {/* Готовые дизайны */}
        <div className="bg-card rounded-xl border p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Готовые дизайны</h2>
          </div>
          <p className="text-sm text-muted-foreground">Выберите тему и настройте под себя</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {DESIGN_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className={`relative group text-left rounded-xl border-2 p-3 transition-all hover:shadow-md ${
                  activePreset === preset.id
                    ? "border-amber-500 shadow-md ring-2 ring-amber-200"
                    : "border-border hover:border-border"
                }`}
              >
                {activePreset === preset.id && (
                  <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-0.5">
                    <Check className="h-3 w-3" />
                  </div>
                )}
                {/* Мини-превью */}
                <div
                  className="rounded-lg overflow-hidden mb-2 h-16"
                  style={{ backgroundColor: preset.preview.bg }}
                >
                  <div
                    className="h-5 flex items-center px-2"
                    style={{ backgroundColor: preset.preview.header }}
                  >
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-card/40" />
                      <div className="w-1.5 h-1.5 rounded-full bg-card/40" />
                      <div className="w-1.5 h-1.5 rounded-full bg-card/40" />
                    </div>
                  </div>
                  <div className="px-2 py-1 flex gap-1">
                    <div
                      className="w-5 h-5 rounded"
                      style={{ backgroundColor: preset.preview.accent + "30" }}
                    />
                    <div className="flex-1 space-y-1 pt-0.5">
                      <div
                        className="h-1 w-3/4 rounded"
                        style={{ backgroundColor: preset.preview.accent + "40" }}
                      />
                      <div
                        className="h-1 w-1/2 rounded"
                        style={{ backgroundColor: preset.preview.accent + "20" }}
                      />
                    </div>
                  </div>
                </div>
                <p className="text-sm font-medium">{preset.name}</p>
                <p className="text-xs text-muted-foreground">{preset.description}</p>
                {/* Палитра */}
                <div className="flex gap-1 mt-1.5">
                  {[preset.primary_color, preset.secondary_color, preset.accent_color, preset.background_color].map(
                    (c, i) => (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: c }}
                      />
                    )
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Цвета</h2>

          <div className="grid grid-cols-2 gap-4">
            <ColorPicker label="Основной" value={primaryColor} onChange={setPrimaryColor} />
            <ColorPicker label="Вторичный" value={secondaryColor} onChange={setSecondaryColor} />
            <ColorPicker label="Акцент" value={accentColor} onChange={setAccentColor} />
            <ColorPicker label="Фон" value={backgroundColor} onChange={setBackgroundColor} />
            <ColorPicker label="Текст" value={textColor} onChange={setTextColor} />
          </div>
        </div>

        <div className="bg-card rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Шрифт и текст</h2>

          <div className="space-y-2">
            <Label>Шрифт</Label>
            <Select value={font} onValueChange={(val) => val && setFont(val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONTS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Приветственный текст</Label>
            <p className="text-xs text-muted-foreground">Отображается на главной странице магазина под сторис</p>
            <Textarea
              value={welcomeText}
              onChange={(e) => setWelcomeText(e.target.value)}
              placeholder="Добро пожаловать в наш магазин! Здесь вы найдёте..."
              rows={3}
            />
          </div>
        </div>

        <div className="bg-card rounded-xl border p-6 space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Store className="h-4.5 w-4.5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Логотип магазина</h2>
              <p className="text-xs text-muted-foreground">Отображается в шапке магазина и в карточке при шеринге</p>
            </div>
          </div>

          <div className="flex items-start gap-6">
            {/* Preview */}
            <div className="relative group">
              {logoUrl ? (
                <div className="relative">
                  <img
                    src={logoUrl}
                    alt="Логотип"
                    className="h-28 w-28 rounded-2xl object-cover border-2 border-border shadow-sm"
                  />
                  <button
                    onClick={() => setLogoUrl(null)}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    title="Удалить логотип"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="h-28 w-28 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 bg-muted/30">
                  <Store className="h-8 w-8 text-muted-foreground/30" />
                  <span className="text-[10px] text-muted-foreground/50">200×200</span>
                </div>
              )}
            </div>

            {/* Upload */}
            <div className="flex-1 space-y-3 pt-2">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 transition-all">
                <UploadIcon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {logoUrl ? "Заменить логотип" : "Загрузить логотип"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, "logos", setLogoUrl)}
                />
              </label>
              <p className="text-xs text-muted-foreground">PNG, JPG или SVG. Рекомендуемый размер: 200×200 px</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border p-6 space-y-4">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-violet-500" />
            <h2 className="text-lg font-semibold">Стиль карточек товаров</h2>
          </div>
          <p className="text-sm text-muted-foreground">Выберите как будут выглядеть карточки товаров в каталоге</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: "standard", label: "Стандарт", desc: "Классическая карточка" },
              { key: "compact", label: "Компакт", desc: "Маленькие, больше товаров" },
              { key: "elegant", label: "Элегант", desc: "Крупные с описанием" },
              { key: "minimal", label: "Минимал", desc: "Только фото и цена" },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setCardStyle(s.key)}
                className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                  cardStyle === s.key
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/30"
                }`}
              >
                {cardStyle === s.key && (
                  <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
                <p className="font-semibold text-sm">{s.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Социальные сети</h2>
          </div>
          <p className="text-sm text-muted-foreground">Ссылки будут показаны в подвале магазина</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-sm">Instagram</Label>
              <Input placeholder="https://instagram.com/yourstore" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Telegram</Label>
              <Input placeholder="https://t.me/yourstore" value={telegramUrl} onChange={(e) => setTelegramUrl(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">ВКонтакте</Label>
              <Input placeholder="https://vk.com/yourstore" value={vkUrl} onChange={(e) => setVkUrl(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">WhatsApp</Label>
              <Input placeholder="https://wa.me/79991234567" value={whatsappUrl} onChange={(e) => setWhatsappUrl(e.target.value)} />
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          className="w-full bg-primary hover:bg-primary/90"
          disabled={updateSettings.isPending || uploading}
        >
          {(updateSettings.isPending || uploading) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Сохранить дизайн
        </Button>
      </div>

      {/* Preview */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Превью</h2>
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor, color: textColor, fontFamily: font }}
        >
          {/* Banner preview */}
          {bannerUrl ? (
            <img src={bannerUrl} alt="Banner" className="w-full h-40 object-cover" />
          ) : (
            <div className="h-40" style={{ backgroundColor: primaryColor }} />
          )}

          {/* Header preview */}
          <div className="p-4" style={{ backgroundColor: secondaryColor }}>
            <div className="flex items-center gap-3">
              {logoUrl && (
                <img src={logoUrl} alt="Logo" className="h-10 w-10 rounded" />
              )}
              <span className="text-lg font-bold text-white">{store.name}</span>
            </div>
          </div>

          {/* Content preview */}
          <div className="p-6">
            <p className="text-lg mb-4">{welcomeText}</p>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border rounded-lg p-3">
                  <div className="h-20 rounded mb-2" style={{ backgroundColor: accentColor + "20" }} />
                  <p className="text-sm font-medium">Товар {i}</p>
                  <p className="text-sm" style={{ color: primaryColor }}>
                    1 000 ₽
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 rounded cursor-pointer border"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-sm"
        />
      </div>
    </div>
  );
}
