"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send, CheckCircle2, AlertCircle, Gift, Copy, Check, ExternalLink, Share2, AlertTriangle } from "lucide-react";
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
import { useMyStore, useCreateStore, useUpdateStore } from "@/lib/hooks/use-stores";
import { storeSchema, type StoreInput } from "@/lib/validations";
import { STORE_CATEGORIES } from "@/lib/helpers";
import { toast } from "sonner";

export default function StoreManagementPage() {
  const { data: store, isLoading } = useMyStore();
  const createStore = useCreateStore();
  const updateStore = useUpdateStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<StoreInput>({
    resolver: zodResolver(storeSchema) as any,
    defaultValues: store
      ? {
          name: store.name,
          description: store.description,
          category: store.category,
          contact_email: store.contact_email,
        }
      : { category: "Другое" },
  });

  const category = watch("category");

  const onSubmit = async (input: StoreInput) => {
    try {
      if (store) {
        await updateStore.mutateAsync({ id: store.id, ...input });
        toast.success("Магазин обновлён");
      } else {
        await createStore.mutateAsync(input);
        toast.success("Магазин создан! Теперь настройте дизайн.");
      }
    } catch {
      toast.error("Ошибка сохранения");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  const isPending = createStore.isPending || updateStore.isPending;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">
        {store ? "Настройки магазина" : "Создать магазин"}
      </h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-xl border p-6 space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="name">Название магазина</Label>
          <Input
            id="name"
            placeholder="Мой Магазин"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Описание</Label>
          <Textarea
            id="description"
            placeholder="Расскажите о вашем магазине..."
            rows={4}
            {...register("description")}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Категория</Label>
          <Select
            value={category}
            onValueChange={(val) => val && setValue("category", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите категорию" />
            </SelectTrigger>
            <SelectContent>
              {STORE_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-red-500">{errors.category.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_email">Контактный email</Label>
          <Input
            id="contact_email"
            type="email"
            placeholder="shop@example.com"
            {...register("contact_email")}
          />
          {errors.contact_email && (
            <p className="text-sm text-red-500">{errors.contact_email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-amber-500 hover:bg-amber-600"
          disabled={isPending}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {store ? "Сохранить" : "Создать магазин"}
        </Button>
      </form>

      {/* Telegram уведомления */}
      {store && <TelegramSettings storeId={store.id} currentChatId={store.telegram_chat_id} />}

      {/* Скидка на первую покупку */}
      {store && (
        <FirstOrderDiscountSettings
          storeId={store.id}
          currentType={store.first_order_discount_type}
          currentValue={store.first_order_discount_value}
        />
      )}

      {/* Порог низкого остатка */}
      {store && (
        <LowStockThresholdSettings
          storeId={store.id}
          currentThreshold={store.low_stock_threshold ?? 5}
        />
      )}

      {/* Поделиться */}
      {store && <ShareSection storeName={store.name} storeSlug={store.slug} />}
    </div>
  );
}

function TelegramSettings({
  storeId,
  currentChatId,
}: {
  storeId: string;
  currentChatId: string | null;
}) {
  const updateStore = useUpdateStore();
  const [chatId, setChatId] = useState(currentChatId || "");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const handleSave = async () => {
    try {
      await updateStore.mutateAsync({
        id: storeId,
        telegram_chat_id: chatId.trim() || null,
      });
      toast.success(chatId.trim() ? "Telegram подключён" : "Telegram отключён");
    } catch {
      toast.error("Ошибка сохранения");
    }
  };

  const handleTest = async () => {
    if (!chatId.trim()) {
      toast.error("Введите Chat ID");
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId.trim(),
          store_name: "Тестовый магазин",
          order_id: "test-1234-5678",
          total: "1 500",
          items_count: 3,
          address: "Тестовый адрес",
          phone: "+7 (999) 123-45-67",
        }),
      });
      if (res.ok) {
        setTestResult("success");
        toast.success("Тестовое сообщение отправлено! Проверьте Telegram.");
      } else {
        setTestResult("error");
        toast.error("Ошибка отправки. Проверьте Chat ID и токен бота.");
      }
    } catch {
      setTestResult("error");
      toast.error("Ошибка подключения");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Send className="h-5 w-5 text-blue-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Telegram-уведомления</h2>
          <p className="text-sm text-gray-500">
            Получайте уведомления о новых заказах в Telegram
          </p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
        <p className="font-medium">Как настроить:</p>
        <ol className="list-decimal list-inside space-y-1 text-gray-600">
          <li>
            Откройте{" "}
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              @BotFather
            </a>{" "}
            в Telegram → отправьте <code className="bg-gray-200 px-1 rounded">/newbot</code>
          </li>
          <li>Скопируйте полученный токен бота</li>
          <li>
            Напишите любое сообщение вашему боту, затем откройте:{" "}
            <code className="bg-gray-200 px-1 rounded text-xs break-all">
              https://api.telegram.org/bot&lt;ТОКЕН&gt;/getUpdates
            </code>
          </li>
          <li>
            Найдите <code className="bg-gray-200 px-1 rounded">chat.id</code> — это ваш Chat ID
          </li>
        </ol>
      </div>

      <div className="space-y-2">
        <Label htmlFor="telegram_chat_id">Telegram Chat ID</Label>
        <div className="flex gap-2">
          <Input
            id="telegram_chat_id"
            placeholder="123456789"
            value={chatId}
            onChange={(e) => {
              setChatId(e.target.value);
              setTestResult(null);
            }}
            className="font-mono"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleTest}
            disabled={testing || !chatId.trim()}
            className="shrink-0"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : testResult === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : testResult === "error" ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : (
              "Тест"
            )}
          </Button>
        </div>
      </div>

      <Button
        type="button"
        onClick={handleSave}
        className="w-full bg-blue-500 hover:bg-blue-600"
        disabled={updateStore.isPending}
      >
        {updateStore.isPending && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {chatId.trim() ? "Сохранить Chat ID" : "Отключить уведомления"}
      </Button>
    </div>
  );
}

function FirstOrderDiscountSettings({
  storeId,
  currentType,
  currentValue,
}: {
  storeId: string;
  currentType: "percent" | "fixed" | null;
  currentValue: number;
}) {
  const updateStore = useUpdateStore();
  const [enabled, setEnabled] = useState(!!currentType);
  const [discountType, setDiscountType] = useState<"percent" | "fixed">(
    currentType || "percent"
  );
  const [value, setValue] = useState(String(currentValue || ""));

  const handleSave = async () => {
    try {
      await updateStore.mutateAsync({
        id: storeId,
        first_order_discount_type: enabled ? discountType : null,
        first_order_discount_value: enabled ? Number(value) || 0 : 0,
      });
      toast.success(enabled ? "Скидка на первую покупку настроена" : "Скидка отключена");
    } catch {
      toast.error("Ошибка сохранения");
    }
  };

  return (
    <div className="bg-white rounded-xl border p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-50 rounded-lg">
          <Gift className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Скидка на первую покупку</h2>
          <p className="text-sm text-gray-500">
            Автоматическая скидка для новых клиентов
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
          />
          <span className="text-sm font-medium">Включить скидку</span>
        </label>
      </div>

      {enabled && (
        <div className="flex gap-3">
          <Select
            value={discountType}
            onValueChange={(val) => val && setDiscountType(val as "percent" | "fixed")}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percent">Процент (%)</SelectItem>
              <SelectItem value="fixed">Фикс. сумма (₽)</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder={discountType === "percent" ? "10" : "500"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-32"
            min={0}
            max={discountType === "percent" ? 100 : undefined}
          />
        </div>
      )}

      <Button
        type="button"
        onClick={handleSave}
        className="w-full bg-amber-500 hover:bg-amber-600"
        disabled={updateStore.isPending}
      >
        {updateStore.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Сохранить
      </Button>
    </div>
  );
}

function LowStockThresholdSettings({
  storeId,
  currentThreshold,
}: {
  storeId: string;
  currentThreshold: number;
}) {
  const updateStore = useUpdateStore();
  const [threshold, setThreshold] = useState(String(currentThreshold));

  const handleSave = async () => {
    try {
      await updateStore.mutateAsync({
        id: storeId,
        low_stock_threshold: Math.max(0, Number(threshold) || 0),
      });
      toast.success("Порог остатка сохранён");
    } catch {
      toast.error("Ошибка сохранения");
    }
  };

  return (
    <div className="bg-white rounded-xl border p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-50 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-red-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Предупреждение о низком остатке</h2>
          <p className="text-sm text-gray-500">
            Показать предупреждение на дашборде, когда остаток товара ≤ порога
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Label className="shrink-0">Порог (шт.)</Label>
        <Input
          type="number"
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          className="w-24"
          min={0}
        />
      </div>

      <Button
        type="button"
        onClick={handleSave}
        className="w-full bg-amber-500 hover:bg-amber-600"
        disabled={updateStore.isPending}
      >
        {updateStore.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Сохранить
      </Button>
    </div>
  );
}

function ShareSection({ storeName, storeSlug }: { storeName: string; storeSlug: string }) {
  const [copied, setCopied] = useState(false);
  const storeUrl = typeof window !== "undefined" ? `${window.location.origin}/store/${storeSlug}` : `/store/${storeSlug}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    toast.success("Ссылка скопирована!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-50 rounded-lg">
          <Share2 className="h-5 w-5 text-purple-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Поделиться магазином</h2>
          <p className="text-sm text-gray-500">Ссылка для покупателей</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Input value={storeUrl} readOnly className="font-mono text-sm" />
        <Button onClick={handleCopy} variant="outline" className="shrink-0">
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
        <a href={storeUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="shrink-0">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <a href={`https://t.me/share/url?url=${encodeURIComponent(storeUrl)}&text=${encodeURIComponent(`Загляните в мой магазин "${storeName}"!`)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-2.5 rounded-lg border hover:bg-gray-50 transition-colors text-sm">
          Telegram
        </a>
        <a href={`https://wa.me/?text=${encodeURIComponent(`Загляните в мой магазин "${storeName}"! ${storeUrl}`)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-2.5 rounded-lg border hover:bg-gray-50 transition-colors text-sm">
          WhatsApp
        </a>
        <a href={`https://vk.com/share.php?url=${encodeURIComponent(storeUrl)}&title=${encodeURIComponent(storeName)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-2.5 rounded-lg border hover:bg-gray-50 transition-colors text-sm">
          VK
        </a>
      </div>
    </div>
  );
}
