"use client";

import { useState } from "react";
import {
  FolderTree,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Check,
  X,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMyStore } from "@/lib/hooks/use-stores";
import {
  useStoreCategories,
  useCreateStoreCategory,
  useUpdateStoreCategory,
  useDeleteStoreCategory,
} from "@/lib/hooks/use-store-categories";
import { toast } from "sonner";
import type { StoreCategory } from "@/lib/types/database";

export default function CategoriesPage() {
  const { data: store, isLoading: storeLoading } = useMyStore();
  const { data: categories, isLoading: catsLoading } = useStoreCategories(
    store?.id
  );
  const createCategory = useCreateStoreCategory();
  const updateCategory = useUpdateStoreCategory();
  const deleteCategory = useDeleteStoreCategory();

  const [newName, setNewName] = useState("");
  const [newParent, setNewParent] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  if (storeLoading || catsLoading) {
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

  const rootCategories =
    categories?.filter((c) => !c.parent_id) || [];
  const getChildren = (parentId: string) =>
    categories?.filter((c) => c.parent_id === parentId) || [];

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      await createCategory.mutateAsync({
        store_id: store.id,
        name,
        parent_id: newParent,
        sort_order: (categories?.length || 0) + 1,
      });
      setNewName("");
      setNewParent(null);
      toast.success("Категория добавлена");
    } catch {
      toast.error("Ошибка");
    }
  };

  const handleUpdate = async (id: string) => {
    const name = editName.trim();
    if (!name) return;
    try {
      await updateCategory.mutateAsync({ id, name });
      setEditingId(null);
      toast.success("Категория обновлена");
    } catch {
      toast.error("Ошибка");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory.mutateAsync(id);
      toast.success("Категория удалена");
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  const renderCategory = (cat: StoreCategory, depth: number = 0) => (
    <div key={cat.id}>
      <div
        className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded-lg"
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
      >
        {depth > 0 && (
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
        )}
        {editingId === cat.id ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-8 text-sm flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUpdate(cat.id);
                if (e.key === "Escape") setEditingId(null);
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleUpdate(cat.id)}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setEditingId(null)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <>
            <span className="flex-1 text-sm font-medium">{cat.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                setEditingId(cat.id);
                setEditName(cat.name);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-500"
              onClick={() => handleDelete(cat.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
      {getChildren(cat.id).map((child) => renderCategory(child, depth + 1))}
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Категории</h1>

      {/* Добавление */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold">Новая категория</h2>
        <div className="flex gap-3">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Название категории"
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <Select
            value={newParent || "root"}
            onValueChange={(val) =>
              setNewParent(val === "root" ? null : val)
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Родительская" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="root">Корневая</SelectItem>
              {rootCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  ↳ {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleCreate}
            disabled={createCategory.isPending || !newName.trim()}
          >
            {createCategory.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Дерево категорий */}
      {!categories?.length ? (
        <div className="text-center py-10 bg-white rounded-xl border">
          <FolderTree className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-1">Категорий пока нет</p>
          <p className="text-gray-400 text-sm">
            Создайте свои категории для товаров. Если не создать — будут
            использоваться стандартные
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border divide-y">
          {rootCategories.map((cat) => renderCategory(cat))}
        </div>
      )}
    </div>
  );
}
