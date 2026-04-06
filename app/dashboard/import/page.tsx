"use client";

import { useState, useRef } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyStore } from "@/lib/hooks/use-stores";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type ImportResult = {
  imported: number;
  total: number;
  errors?: string[];
};

export default function ImportPage() {
  const { data: store, isLoading: storeLoading } = useMyStore();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      // Проверяем расширение
      const ext = f.name.split(".").pop()?.toLowerCase();
      if (!["csv", "tsv", "txt"].includes(ext || "")) {
        toast.error("Поддерживаются только CSV/TSV файлы");
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error("Максимальный размер файла — 5 МБ");
        return;
      }
      setFile(f);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file || !store) return;
    setImporting(true);
    setResult(null);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("store_id", store.id);

      const res = await fetch("/api/import", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Ошибка импорта");
        if (data.details) {
          setResult({ imported: 0, total: 0, errors: data.details });
        }
        return;
      }

      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["store-products"] });
      toast.success(`Импортировано ${data.imported} товаров!`);
    } catch {
      toast.error("Ошибка при загрузке файла");
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const header = "Название;Описание;Цена;Остаток;Категория;Изображения";
    const example1 =
      'Футболка чёрная;"Хлопковая футболка, размер M";1500;50;Одежда;https://example.com/img1.jpg|https://example.com/img2.jpg';
    const example2 = "Кроссовки;Спортивные беговые кроссовки;4990;20;Спорт;";
    const csv = [header, example1, example2].join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "шаблон_импорта.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (storeLoading) {
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Импорт товаров</h1>
        <Button variant="outline" onClick={handleDownloadTemplate}>
          <Download className="mr-2 h-4 w-4" />
          Скачать шаблон
        </Button>
      </div>

      {/* Инструкция */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-2">
        <h3 className="font-medium text-blue-800">Формат файла</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>
            CSV или TSV (разделитель: запятая, точка с запятой или Tab)
          </li>
          <li>Первая строка — заголовки колонок</li>
          <li>
            <strong>Обязательные колонки:</strong> Название (name), Цена
            (price)
          </li>
          <li>
            <strong>Опционально:</strong> Описание, Остаток, Категория,
            Изображения (URL через |)
          </li>
          <li>Максимум 5 МБ</li>
        </ul>
        <p className="text-xs text-blue-600 mt-2">
          Поддерживаемые названия колонок: name/название, price/цена,
          description/описание, stock/остаток/количество, category/категория,
          images/фото
        </p>
      </div>

      {/* Зона загрузки */}
      <div
        className="border-2 border-dashed rounded-xl p-10 text-center hover:border-amber-400 transition-colors cursor-pointer"
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.tsv,.txt"
          className="hidden"
          onChange={handleFileChange}
        />
        {file ? (
          <div className="space-y-2">
            <FileSpreadsheet className="h-12 w-12 text-amber-500 mx-auto" />
            <p className="font-medium">{file.name}</p>
            <p className="text-sm text-gray-500">
              {(file.size / 1024).toFixed(1)} КБ
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-12 w-12 text-gray-400 mx-auto" />
            <p className="text-gray-500">
              Нажмите или перетащите CSV файл
            </p>
          </div>
        )}
      </div>

      {/* Кнопка импорта */}
      {file && (
        <Button
          onClick={handleImport}
          disabled={importing}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white"
          size="lg"
        >
          {importing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Импорт...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Импортировать товары
            </>
          )}
        </Button>
      )}

      {/* Результат */}
      {result && (
        <div className="space-y-3">
          <div
            className={`rounded-xl p-4 flex items-center gap-3 ${
              result.imported > 0
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {result.imported > 0 ? (
              <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-600 shrink-0" />
            )}
            <div>
              <p className="font-medium">
                Импортировано: {result.imported} из {result.total}
              </p>
              {result.errors && result.errors.length > 0 && (
                <p className="text-sm text-gray-500">
                  {result.errors.length} ошибок
                </p>
              )}
            </div>
          </div>

          {result.errors && result.errors.length > 0 && (
            <div className="bg-white border rounded-xl p-4 max-h-60 overflow-y-auto">
              <p className="font-medium text-sm mb-2 text-red-600">Ошибки:</p>
              {result.errors.map((err, i) => (
                <p key={i} className="text-sm text-gray-600">
                  {err}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
