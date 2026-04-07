"use client";

import { useState } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Pencil,
  ArrowLeft,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMyStore } from "@/lib/hooks/use-stores";
import {
  useBlogPosts,
  useCreateBlogPost,
  useUpdateBlogPost,
  useDeleteBlogPost,
} from "@/lib/hooks/use-blog-posts";
import { useUpload } from "@/lib/hooks/use-upload";
import { toast } from "sonner";
import type { BlogPost, PageBlock } from "@/lib/types/database";

export default function BlogDashboardPage() {
  const { data: store } = useMyStore();
  const { data: posts, isLoading } = useBlogPosts(store?.id);
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const deletePost = useDeleteBlogPost();
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (editingPost || isCreating) {
    return (
      <BlogEditor
        storeId={store!.id}
        post={editingPost}
        onSave={async (data) => {
          if (editingPost) {
            await updatePost.mutateAsync({ id: editingPost.id, ...data });
            toast.success("Статья обновлена");
          } else {
            await createPost.mutateAsync({ store_id: store!.id, ...data });
            toast.success("Статья создана");
          }
          setEditingPost(null);
          setIsCreating(false);
        }}
        onCancel={() => {
          setEditingPost(null);
          setIsCreating(false);
        }}
        isPending={createPost.isPending || updatePost.isPending}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Блог</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Новая статья
        </Button>
      </div>

      {!posts?.length ? (
        <div className="text-center py-10 bg-white rounded-xl border">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Пока нет статей</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-xl border p-4 flex items-center gap-4"
            >
              {post.cover_image ? (
                <img
                  src={post.cover_image}
                  alt=""
                  className="h-16 w-24 object-cover rounded-lg shrink-0"
                />
              ) : (
                <div className="h-16 w-24 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                  <ImageIcon className="h-6 w-6 text-gray-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{post.title}</h3>
                <p className="text-xs text-gray-400">
                  {new Date(post.created_at).toLocaleDateString("ru-RU")} · /blog/
                  {post.slug}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {post.is_published ? (
                  <Eye className="h-4 w-4 text-green-500" />
                ) : (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setEditingPost(post)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500"
                  onClick={async () => {
                    await deletePost.mutateAsync(post.id);
                    toast.success("Статья удалена");
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

function BlogEditor({
  storeId,
  post,
  onSave,
  onCancel,
  isPending,
}: {
  storeId: string;
  post: BlogPost | null;
  onSave: (data: {
    title: string;
    slug: string;
    content: PageBlock[];
    cover_image?: string | null;
    is_published: boolean;
  }) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState(post?.title || "");
  const [slug, setSlug] = useState(post?.slug || "");
  const [blocks, setBlocks] = useState<PageBlock[]>(
    (post?.content as PageBlock[]) || [{ type: "text", content: "" }]
  );
  const [coverImage, setCoverImage] = useState(post?.cover_image || "");
  const [isPublished, setIsPublished] = useState(post?.is_published ?? false);
  const { upload, uploading: uploadingCover } = useUpload();

  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-zа-яё0-9\s-]/gi, "")
      .replace(/\s+/g, "-")
      .slice(0, 80);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!post) setSlug(generateSlug(val));
  };

  const addBlock = (type: PageBlock["type"]) => {
    setBlocks([...blocks, { type, content: "" }]);
  };

  const updateBlock = (i: number, content: string) => {
    const updated = [...blocks];
    updated[i] = { ...updated[i], content };
    setBlocks(updated);
  };

  const removeBlock = (i: number) => {
    setBlocks(blocks.filter((_, idx) => idx !== i));
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Макс. 2 МБ");
      return;
    }
    try {
      const url = await upload("store-assets", storeId, file);
      setCoverImage(url);
    } catch {
      toast.error("Ошибка загрузки");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">
          {post ? "Редактировать статью" : "Новая статья"}
        </h1>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Заголовок</Label>
            <Input value={title} onChange={(e) => handleTitleChange(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1">
          <Label>Обложка</Label>
          <div className="flex items-center gap-3">
            {coverImage && (
              <img src={coverImage} alt="" className="h-20 w-32 object-cover rounded-lg" />
            )}
            <label className="inline-flex items-center gap-2 cursor-pointer rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
              <ImageIcon className="h-4 w-4" />
              Загрузить
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            </label>
            <Input
              placeholder="или вставьте URL"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="published"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="accent-amber-500 h-4 w-4"
          />
          <Label htmlFor="published">Опубликовать</Label>
        </div>
      </div>

      {/* Блоки контента */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold">Контент</h2>
        {blocks.map((block, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1">
              {block.type === "heading" ? (
                <Input
                  placeholder="Заголовок"
                  value={block.content}
                  onChange={(e) => updateBlock(i, e.target.value)}
                  className="font-bold text-lg"
                />
              ) : block.type === "text" ? (
                <Textarea
                  placeholder="Текст..."
                  value={block.content}
                  onChange={(e) => updateBlock(i, e.target.value)}
                  rows={4}
                />
              ) : block.type === "image" ? (
                <Input
                  placeholder="URL изображения"
                  value={block.content}
                  onChange={(e) => updateBlock(i, e.target.value)}
                />
              ) : (
                <hr className="my-2 border-gray-200" />
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 shrink-0"
              onClick={() => removeBlock(i)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => addBlock("heading")}>
            + Заголовок
          </Button>
          <Button variant="outline" size="sm" onClick={() => addBlock("text")}>
            + Текст
          </Button>
          <Button variant="outline" size="sm" onClick={() => addBlock("image")}>
            + Изображение
          </Button>
          <Button variant="outline" size="sm" onClick={() => addBlock("divider")}>
            + Разделитель
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={() =>
            onSave({
              title,
              slug,
              content: blocks,
              cover_image: coverImage || null,
              is_published: isPublished,
            })
          }
          disabled={isPending || !title.trim() || !slug.trim()}
        >
          {isPending ? "Сохранение..." : "Сохранить"}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </div>
  );
}
