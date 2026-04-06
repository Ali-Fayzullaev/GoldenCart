"use client";

import { useState } from "react";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Type,
  AlignLeft,
  ImageIcon,
  Minus,
  ArrowUp,
  ArrowDown,
  GripVertical,
} from "lucide-react";
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
import { useMyStore } from "@/lib/hooks/use-stores";
import {
  useStorePages,
  useCreateStorePage,
  useUpdateStorePage,
  useDeleteStorePage,
} from "@/lib/hooks/use-store-pages";
import { slugify } from "@/lib/helpers";
import { toast } from "sonner";
import type { StorePage, PageBlock } from "@/lib/types/database";

export default function CMSPagesPage() {
  const { data: store, isLoading: storeLoading } = useMyStore();
  const { data: pages, isLoading: pagesLoading } = useStorePages(store?.id);
  const [editing, setEditing] = useState<StorePage | null>(null);
  const [creating, setCreating] = useState(false);
  const deletePage = useDeleteStorePage();

  if (storeLoading || pagesLoading) {
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

  if (editing || creating) {
    return (
      <PageEditor
        storeId={store.id}
        storeSlug={store.slug}
        page={editing}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Страницы</h1>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Новая страница
        </Button>
      </div>

      {!pages?.length ? (
        <div className="text-center py-20 bg-white rounded-xl border">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">Страниц пока нет</p>
          <p className="text-gray-400 text-sm">
            Создайте страницы «О нас», «Доставка», «Контакты»
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {pages.map((page) => (
            <div
              key={page.id}
              className="bg-white rounded-xl border p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">{page.title}</p>
                  <p className="text-xs text-gray-400">
                    /store/{store.slug}/page/{page.slug}
                  </p>
                </div>
                {!page.is_published && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                    Черновик
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditing(page)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-700"
                  onClick={async () => {
                    try {
                      await deletePage.mutateAsync(page.id);
                      toast.success("Страница удалена");
                    } catch {
                      toast.error("Ошибка удаления");
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PageEditor({
  storeId,
  storeSlug,
  page,
  onClose,
}: {
  storeId: string;
  storeSlug: string;
  page: StorePage | null;
  onClose: () => void;
}) {
  const createPage = useCreateStorePage();
  const updatePage = useUpdateStorePage();
  const [title, setTitle] = useState(page?.title || "");
  const [pageSlug, setPageSlug] = useState(page?.slug || "");
  const [isPublished, setIsPublished] = useState(page?.is_published ?? true);
  const [blocks, setBlocks] = useState<PageBlock[]>(
    page?.blocks || [{ type: "text", content: "" }]
  );
  const isPending = createPage.isPending || updatePage.isPending;

  const autoSlug = (t: string) => {
    if (!page) setPageSlug(slugify(t) || "page");
  };

  const addBlock = (type: PageBlock["type"]) => {
    setBlocks((prev) => [...prev, { type, content: "" }]);
  };

  const updateBlock = (index: number, content: string) => {
    setBlocks((prev) =>
      prev.map((b, i) => (i === index ? { ...b, content } : b))
    );
  };

  const removeBlock = (index: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= blocks.length) return;
    setBlocks((prev) => {
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  };

  const handleSave = async () => {
    if (!title.trim() || !pageSlug.trim()) {
      toast.error("Заполните название и slug");
      return;
    }
    try {
      if (page) {
        await updatePage.mutateAsync({
          id: page.id,
          title: title.trim(),
          slug: pageSlug.trim(),
          blocks,
          is_published: isPublished,
        });
        toast.success("Страница обновлена");
      } else {
        await createPage.mutateAsync({
          store_id: storeId,
          title: title.trim(),
          slug: pageSlug.trim(),
          blocks,
          is_published: isPublished,
        });
        toast.success("Страница создана");
      }
      onClose();
    } catch {
      toast.error("Ошибка сохранения");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {page ? "Редактирование" : "Новая страница"}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Сохранить
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Название</Label>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                autoSlug(e.target.value);
              }}
              placeholder="О нас"
            />
          </div>
          <div className="space-y-2">
            <Label>URL (slug)</Label>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400 shrink-0">
                /store/{storeSlug}/page/
              </span>
              <Input
                value={pageSlug}
                onChange={(e) => setPageSlug(e.target.value)}
                placeholder="about"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsPublished(!isPublished)}
            className="flex items-center gap-2 text-sm"
          >
            {isPublished ? (
              <>
                <Eye className="h-4 w-4 text-green-500" />
                <span className="text-green-700">Опубликована</span>
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Черновик</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Блоки */}
      <div className="space-y-3">
        <h2 className="font-semibold">Содержимое</h2>

        {blocks.map((block, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <GripVertical className="h-4 w-4" />
                {block.type === "heading" && (
                  <>
                    <Type className="h-4 w-4" /> Заголовок
                  </>
                )}
                {block.type === "text" && (
                  <>
                    <AlignLeft className="h-4 w-4" /> Текст
                  </>
                )}
                {block.type === "image" && (
                  <>
                    <ImageIcon className="h-4 w-4" /> Изображение
                  </>
                )}
                {block.type === "divider" && (
                  <>
                    <Minus className="h-4 w-4" /> Разделитель
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => moveBlock(i, -1)}
                  disabled={i === 0}
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => moveBlock(i, 1)}
                  disabled={i === blocks.length - 1}
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-500"
                  onClick={() => removeBlock(i)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {block.type === "heading" && (
              <Input
                value={block.content}
                onChange={(e) => updateBlock(i, e.target.value)}
                placeholder="Заголовок секции"
                className="font-semibold text-lg"
              />
            )}
            {block.type === "text" && (
              <Textarea
                value={block.content}
                onChange={(e) => updateBlock(i, e.target.value)}
                placeholder="Текст..."
                rows={4}
              />
            )}
            {block.type === "image" && (
              <Input
                value={block.content}
                onChange={(e) => updateBlock(i, e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            )}
            {block.type === "divider" && (
              <hr className="border-gray-200" />
            )}
          </div>
        ))}

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addBlock("heading")}
          >
            <Type className="mr-1 h-3.5 w-3.5" /> Заголовок
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addBlock("text")}
          >
            <AlignLeft className="mr-1 h-3.5 w-3.5" /> Текст
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addBlock("image")}
          >
            <ImageIcon className="mr-1 h-3.5 w-3.5" /> Изображение
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addBlock("divider")}
          >
            <Minus className="mr-1 h-3.5 w-3.5" /> Разделитель
          </Button>
        </div>
      </div>
    </div>
  );
}
