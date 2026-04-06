"use client";

import { useState, useEffect } from "react";
import { Loader2, Upload as UploadIcon } from "lucide-react";
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
    }
  }, [settings]);

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
      });
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
        <p className="text-gray-500">Сначала создайте магазин</p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Settings */}
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Дизайн магазина</h1>

        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Цвета</h2>

          <div className="grid grid-cols-2 gap-4">
            <ColorPicker label="Основной" value={primaryColor} onChange={setPrimaryColor} />
            <ColorPicker label="Вторичный" value={secondaryColor} onChange={setSecondaryColor} />
            <ColorPicker label="Акцент" value={accentColor} onChange={setAccentColor} />
            <ColorPicker label="Фон" value={backgroundColor} onChange={setBackgroundColor} />
            <ColorPicker label="Текст" value={textColor} onChange={setTextColor} />
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 space-y-4">
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
            <Textarea
              value={welcomeText}
              onChange={(e) => setWelcomeText(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Логотип и баннер</h2>

          <div className="space-y-2">
            <Label>Логотип</Label>
            <div className="flex items-center gap-3">
              {logoUrl && (
                <img src={logoUrl} alt="Logo" className="h-12 w-12 rounded object-cover" />
              )}
              <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50">
                <UploadIcon className="h-4 w-4" />
                <span className="text-sm">Загрузить</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, "logos", setLogoUrl)}
                />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Баннер</Label>
            <div className="space-y-2">
              {bannerUrl && (
                <img src={bannerUrl} alt="Banner" className="w-full h-32 rounded object-cover" />
              )}
              <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 w-fit">
                <UploadIcon className="h-4 w-4" />
                <span className="text-sm">Загрузить баннер</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, "banners", setBannerUrl)}
                />
              </label>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          className="w-full bg-amber-500 hover:bg-amber-600"
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
