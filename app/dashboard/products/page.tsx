"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Loader2, Package } from "lucide-react";
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
import { toast } from "sonner";
import type { Product } from "@/lib/types/database";

export default function ProductsManagementPage() {
  const { data: store, isLoading: storeLoading } = useMyStore();
  const { data: products, isLoading: productsLoading } = useStoreProducts(store?.id);
  const deleteProduct = useDeleteProduct();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

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
        <p className="text-gray-500">Сначала создайте магазин</p>
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
            render={<Button className="bg-amber-500 hover:bg-amber-600" />}
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
        <div className="text-center py-20 bg-white rounded-xl border">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Нет товаров. Добавьте первый!</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
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
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                          <Package className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{product.category}</Badge>
                  </TableCell>
                  <TableCell>{formatPrice(product.price)}</TableCell>
                  <TableCell>{product.stock}</TableCell>
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
      )}
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
  const [images, setImages] = useState<string[]>(product?.images || []);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      if (images.length >= 5) break;
      try {
        const url = await upload("products", storeId, file);
        setImages((prev) => [...prev, url]);
      } catch {
        toast.error("Ошибка загрузки");
      }
    }
  };

  const onSubmit = async (input: ProductInput) => {
    try {
      if (product) {
        await updateProduct.mutateAsync({ id: product.id, ...input, images });
        toast.success("Товар обновлён");
      } else {
        await createProduct.mutateAsync({ ...input, store_id: storeId, images });
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
            <label className="h-20 w-20 rounded border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-gray-50">
              <Plus className="h-5 w-5 text-gray-400" />
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
            {PRODUCT_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        className="w-full bg-amber-500 hover:bg-amber-600"
        disabled={isPending || uploading}
      >
        {(isPending || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {product ? "Сохранить" : "Добавить товар"}
      </Button>
    </form>
  );
}
