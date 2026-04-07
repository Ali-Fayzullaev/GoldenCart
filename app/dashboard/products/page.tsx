"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Loader2, Package, X, Link2, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download, ChevronDown, Copy, EyeOff, Eye, DollarSign } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useMyStore } from "@/lib/hooks/use-stores";
import {
  useStoreProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/lib/hooks/use-products";
import { useUpload } from "@/lib/hooks/use-upload";
import { productSchema, type ProductInput } from "@/lib/validations";
import { PRODUCT_CATEGORIES, formatPrice } from "@/lib/helpers";
import { useStoreCategories } from "@/lib/hooks/use-store-categories";
import { toast } from "sonner";
import type { Product, ProductVariantOption } from "@/lib/types/database";

type ImportResult = { imported: number; total: number; errors?: string[] };

export default function ProductsManagementPage() {
  const { data: store, isLoading: storeLoading } = useMyStore();
  const { data: products, isLoading: productsLoading } = useStoreProducts(store?.id);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"" | "delete" | "hide" | "show" | "price">("");
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkPending, setBulkPending] = useState(false);

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить товар?")) return;
    try {
      await deleteProduct.mutateAsync(id);
      toast.success("Товар удалён");
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  const handleDuplicate = async (product: Product) => {
    if (!store) return;
    try {
      await createProduct.mutateAsync({
        store_id: store.id,
        name: product.name + " (копия)",
        description: product.description,
        price: product.price,
        stock: product.stock,
        category: product.category,
        images: product.images,
        variants: product.variants,
      });
      toast.success("Товар скопирован");
    } catch {
      toast.error("Ошибка копирования");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!products) return;
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)));
    }
  };

  const handleBulkApply = async () => {
    if (!bulkAction || !selectedIds.size) return;
    setBulkPending(true);
    const supabase = createClient();
    try {
      const ids = Array.from(selectedIds);
      if (bulkAction === "delete") {
        if (!confirm(`Удалить ${ids.length} товар(ов)?`)) { setBulkPending(false); return; }
        const { error } = await supabase.from("products").delete().in("id", ids);
        if (error) throw error;
        toast.success(`Удалено: ${ids.length}`);
      } else if (bulkAction === "hide") {
        const { error } = await supabase.from("products").update({ is_active: false } as never).in("id", ids);
        if (error) throw error;
        toast.success(`Скрыто: ${ids.length}`);
      } else if (bulkAction === "show") {
        const { error } = await supabase.from("products").update({ is_active: true } as never).in("id", ids);
        if (error) throw error;
        toast.success(`Активировано: ${ids.length}`);
      } else if (bulkAction === "price") {
        const newPrice = Number(bulkPrice);
        if (!newPrice || newPrice <= 0) { toast.error("Укажите корректную цену"); setBulkPending(false); return; }
        const { error } = await supabase.from("products").update({ price: newPrice } as never).in("id", ids);
        if (error) throw error;
        toast.success(`Цена обновлена: ${ids.length} товар(ов)`);
      }
      setSelectedIds(new Set());
      setBulkAction("");
      setBulkPrice("");
      queryClient.invalidateQueries({ queryKey: ["store-products"] });
      queryClient.invalidateQueries({ queryKey: ["public-products"] });
    } catch {
      toast.error("Ошибка массового действия");
    } finally {
      setBulkPending(false);
    }
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const ext = f.name.split(".").pop()?.toLowerCase();
      if (!["csv", "tsv", "txt"].includes(ext || "")) { toast.error("Поддерживаются только CSV/TSV файлы"); return; }
      if (f.size > 5 * 1024 * 1024) { toast.error("Максимальный размер файла — 5 МБ"); return; }
      setImportFile(f);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!importFile || !store) return;
    setImporting(true);
    setImportResult(null);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("store_id", store.id);
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Ошибка импорта");
        if (data.details) setImportResult({ imported: 0, total: 0, errors: data.details });
        return;
      }
      setImportResult(data);
      queryClient.invalidateQueries({ queryKey: ["store-products"] });
      toast.success(`Импортировано ${data.imported} товаров!`);
    } catch { toast.error("Ошибка при загрузке файла"); }
    finally { setImporting(false); }
  };

  const handleDownloadTemplate = () => {
    const header = "Название;Описание;Цена;Остаток;Категория;Изображения";
    const example1 = 'Футболка чёрная;"Хлопковая футболка, размер M";1500;50;Одежда;https://example.com/img1.jpg|https://example.com/img2.jpg';
    const example2 = "Кроссовки;Спортивные беговые кроссовки;4990;20;Спорт;";
    const csv = [header, example1, example2].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "шаблон_импорта.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (storeLoading || productsLoading) {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Товары</h1>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditProduct(null);
          }}
        >
          <DialogTrigger
            render={<Button className="bg-primary hover:bg-primary/90" />}
          >
            <Plus className="mr-2 h-4 w-4" />
            Добавить товар
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editProduct ? "Редактировать товар" : "Новый товар"}
              </DialogTitle>
            </DialogHeader>
            <ProductForm
              storeId={store.id}
              product={editProduct}
              onSuccess={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {!products?.length ? (
        <div className="text-center py-20 bg-card rounded-xl border">
          <Package className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">Нет товаров. Добавьте первый!</p>
        </div>
      ) : (
        <>
          {/* Bulk actions bar */}
          {selectedIds.size > 0 && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-primary">
                Выбрано: {selectedIds.size}
              </span>
              <Select value={bulkAction} onValueChange={(val) => val !== null && setBulkAction(val as typeof bulkAction)}>
                <SelectTrigger className="w-48 h-9 bg-card">
                  <SelectValue placeholder="Действие..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delete">
                    <span className="flex items-center gap-1.5"><Trash2 className="h-3.5 w-3.5 text-red-500" /> Удалить</span>
                  </SelectItem>
                  <SelectItem value="hide">
                    <span className="flex items-center gap-1.5"><EyeOff className="h-3.5 w-3.5" /> Скрыть</span>
                  </SelectItem>
                  <SelectItem value="show">
                    <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> Активировать</span>
                  </SelectItem>
                  <SelectItem value="price">
                    <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Изменить цену</span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {bulkAction === "price" && (
                <Input
                  type="number"
                  placeholder="Новая цена ₽"
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(e.target.value)}
                  className="w-32 h-9"
                  min={0}
                />
              )}
              {bulkAction && (
                <Button
                  size="sm"
                  onClick={handleBulkApply}
                  disabled={bulkPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  {bulkPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Применить"}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSelectedIds(new Set()); setBulkAction(""); }}
              >
                Отмена
              </Button>
            </div>
          )}

          <div className="bg-card rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={products.length > 0 && selectedIds.size === products.length}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </TableHead>
                <TableHead>Товар</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead>Остаток</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} className={selectedIds.has(product.id) ? "bg-primary/10" : ""}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-secondary flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground/60" />
                        </div>
                      )}
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{product.category}</Badge>
                  </TableCell>
                  <TableCell>{formatPrice(product.price)}</TableCell>
                  <TableCell>
                    <span className={product.stock === 0 ? "text-red-500 font-medium" : product.stock <= (store?.low_stock_threshold ?? 5) ? "text-primary font-medium" : ""}>
                      {product.stock}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? "Активен" : "Скрыт"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicate(product)}
                        title="Копировать"
                      >
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        </>
      )}

      {/* CSV Import section */}
      <div className="bg-card rounded-xl border">
        <button
          onClick={() => setShowImport(!showImport)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-accent transition-colors"
        >
          <div className="flex items-center gap-3">
            <Upload className="h-5 w-5 text-muted-foreground/60" />
            <div>
              <p className="font-medium text-sm">Импорт из CSV</p>
              <p className="text-xs text-muted-foreground/60">Массовая загрузка товаров из файла</p>
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground/60 transition-transform ${showImport ? "rotate-180" : ""}`} />
        </button>
        {showImport && (
          <div className="px-4 pb-4 space-y-4 border-t">
            <div className="flex items-center justify-between pt-3">
              <p className="text-sm text-muted-foreground">CSV/TSV, разделитель: запятая/; /Tab. Обязательно: Название, Цена.</p>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <Download className="mr-1 h-3.5 w-3.5" />
                Шаблон
              </Button>
            </div>
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center hover:border-amber-400 transition-colors cursor-pointer"
              onClick={() => importFileRef.current?.click()}
            >
              <input ref={importFileRef} type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={handleImportFileChange} />
              {importFile ? (
                <div className="flex items-center justify-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  <span className="font-medium text-sm">{importFile.name}</span>
                  <span className="text-xs text-muted-foreground/60">({(importFile.size / 1024).toFixed(1)} КБ)</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Нажмите, чтобы выбрать CSV файл</p>
              )}
            </div>
            {importFile && (
              <Button onClick={handleImport} disabled={importing} className="w-full bg-primary hover:bg-primary/90 text-white">
                {importing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Импорт...</> : <><Upload className="mr-2 h-4 w-4" />Импортировать</>}
              </Button>
            )}
            {importResult && (
              <div className={`rounded-lg p-3 flex items-center gap-3 ${importResult.imported > 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                {importResult.imported > 0 ? <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" /> : <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />}
                <p className="text-sm font-medium">Импортировано: {importResult.imported} из {importResult.total}</p>
              </div>
            )}
            {importResult?.errors && importResult.errors.length > 0 && (
              <div className="bg-card border rounded-lg p-3 max-h-40 overflow-y-auto text-xs text-muted-foreground space-y-0.5">
                {importResult.errors.map((err, i) => <p key={i}>{err}</p>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductForm({
  storeId,
  product,
  onSuccess,
}: {
  storeId: string;
  product: Product | null;
  onSuccess: () => void;
}) {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const { upload, uploading } = useUpload();
  const { data: storeCategories } = useStoreCategories(storeId);
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [variants, setVariants] = useState<ProductVariantOption[]>(
    product?.variants || []
  );
  const [newVariantName, setNewVariantName] = useState("");
  const [newVariantValue, setNewVariantValue] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const addNewVariant = () => {
    const name = newVariantName.trim();
    const values = newVariantValue
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (!name || !values.length) return;
    if (variants.some((v) => v.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Такой вариант уже существует");
      return;
    }
    setVariants((prev) => [...prev, { name, values }]);
    setNewVariantName("");
    setNewVariantValue("");
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: product
      ? {
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          category: product.category,
        }
      : { category: "Другое" },
  });

  const category = watch("category");
  const isPending = createProduct.isPending || updateProduct.isPending;

  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 МБ

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      if (images.length >= 5) break;
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" превышает 2 МБ`);
        continue;
      }
      try {
        const url = await upload("products", storeId, file);
        setImages((prev) => [...prev, url]);
      } catch {
        toast.error("Ошибка загрузки");
      }
    }
  };

  const handleAddImageUrl = () => {
    const url = imageUrl.trim();
    if (!url) return;
    if (images.length >= 5) {
      toast.error("Максимум 5 изображений");
      return;
    }
    try {
      new URL(url);
    } catch {
      toast.error("Некорректный URL");
      return;
    }
    setImages((prev) => [...prev, url]);
    setImageUrl("");
  };

  const onSubmit = async (input: ProductInput) => {
    try {
      if (product) {
        await updateProduct.mutateAsync({ id: product.id, ...input, images, variants });
        toast.success("Товар обновлён");
      } else {
        await createProduct.mutateAsync({ ...input, store_id: storeId, images, variants });
        toast.success("Товар добавлен");
      }
      onSuccess();
    } catch {
      toast.error("Ошибка сохранения");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Изображения (до 5)</Label>
        <div className="flex flex-wrap gap-2">
          {images.map((url, i) => (
            <div key={i} className="relative">
              <img src={url} alt="" className="h-20 w-20 rounded object-cover" />
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
          {images.length < 5 && (
            <label className="h-20 w-20 rounded border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-accent">
              <Plus className="h-5 w-5 text-muted-foreground/60" />
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
          )}
        </div>
        {uploading && (
          <p className="text-xs text-primary flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> Загрузка...
          </p>
        )}
        <p className="text-xs text-muted-foreground/60">Макс. размер файла: 2 МБ</p>
        {images.length < 5 && (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="pl-8 text-sm"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddImageUrl())}
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleAddImageUrl}>
              Добавить URL
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Название</Label>
        <Input id="name" placeholder="Название товара" {...register("name")} />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Описание</Label>
        <Textarea id="description" rows={3} {...register("description")} />
        {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Цена (₽)</Label>
          <Input id="price" type="number" step="0.01" {...register("price")} />
          {errors.price && <p className="text-sm text-red-500">{errors.price.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock">Остаток</Label>
          <Input id="stock" type="number" {...register("stock")} />
          {errors.stock && <p className="text-sm text-red-500">{errors.stock.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Категория</Label>
        <Select value={category} onValueChange={(val) => val && setValue("category", val)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(storeCategories && storeCategories.length > 0
              ? storeCategories.map((c) => c.name)
              : PRODUCT_CATEGORIES
            ).map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Варианты товара */}
      <div className="space-y-3">
        <Label>Варианты (размер, цвет, вес...)</Label>

        {variants.map((variant, vi) => (
          <div key={vi} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{variant.name}</span>
              <button
                type="button"
                onClick={() =>
                  setVariants((prev) => prev.filter((_, i) => i !== vi))
                }
                className="text-muted-foreground/60 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {variant.values.map((val, valIdx) => (
                <span
                  key={valIdx}
                  className="inline-flex items-center gap-1 bg-secondary text-sm px-2 py-0.5 rounded-full"
                >
                  {val}
                  <button
                    type="button"
                    onClick={() =>
                      setVariants((prev) =>
                        prev.map((v, i) =>
                          i === vi
                            ? {
                                ...v,
                                values: v.values.filter(
                                  (_, j) => j !== valIdx
                                ),
                              }
                            : v
                        ).filter((v) => v.values.length > 0)
                      )
                    }
                  >
                    <X className="h-3 w-3 text-muted-foreground/60 hover:text-red-500" />
                  </button>
                </span>
              ))}
            </div>
            {/* Добавить значение к существующему варианту */}
            <div className="flex gap-2">
              <Input
                placeholder="Новое значение..."
                className="h-8 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val && !variant.values.includes(val)) {
                      setVariants((prev) =>
                        prev.map((v, i) =>
                          i === vi
                            ? { ...v, values: [...v.values, val] }
                            : v
                        )
                      );
                      (e.target as HTMLInputElement).value = "";
                    }
                  }
                }}
              />
            </div>
          </div>
        ))}

        {/* Добавить новый вариант */}
        <div className="flex gap-2">
          <Input
            placeholder="Название (напр. Размер)"
            value={newVariantName}
            onChange={(e) => setNewVariantName(e.target.value)}
            className="h-9 text-sm flex-1"
          />
          <Input
            placeholder="Значения через запятую"
            value={newVariantValue}
            onChange={(e) => setNewVariantValue(e.target.value)}
            className="h-9 text-sm flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addNewVariant();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9"
            onClick={addNewVariant}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground/60">
          Введите название варианта и значения через запятую, затем нажмите +
        </p>
      </div>

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90"
        disabled={isPending || uploading}
      >
        {(isPending || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {product ? "Сохранить" : "Добавить товар"}
      </Button>
    </form>
  );
}
