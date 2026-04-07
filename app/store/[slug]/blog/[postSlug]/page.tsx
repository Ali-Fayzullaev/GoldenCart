"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { useStoreBySlug } from "@/lib/hooks/use-stores";
import { useBlogPost } from "@/lib/hooks/use-blog-posts";
import type { PageBlock } from "@/lib/types/database";

export default function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string; postSlug: string }>;
}) {
  const { slug, postSlug } = use(params);
  const { data: store } = useStoreBySlug(slug);
  const { data: post, isLoading } = useBlogPost(store?.id, postSlug);
  const primaryColor = store?.store_settings?.primary_color || "#f59e0b";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20">
        <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Статья не найдена</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <Link
        href={`/store/${slug}/blog`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Назад к блогу
      </Link>

      {post.cover_image && (
        <img
          src={post.cover_image}
          alt={post.title}
          className="w-full rounded-xl max-h-[400px] object-cover"
        />
      )}

      <div>
        <h1 className="text-3xl font-bold" style={{ color: primaryColor }}>
          {post.title}
        </h1>
        <p className="text-sm text-gray-400 mt-2">
          {new Date(post.created_at).toLocaleDateString("ru-RU", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="space-y-4">
        {(post.content as PageBlock[]).map((block, i) => {
          switch (block.type) {
            case "heading":
              return (
                <h2 key={i} className="text-2xl font-bold">
                  {block.content}
                </h2>
              );
            case "text":
              return (
                <p key={i} className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {block.content}
                </p>
              );
            case "image":
              return block.content ? (
                <img
                  key={i}
                  src={block.content}
                  alt=""
                  className="w-full rounded-xl max-h-[500px] object-cover"
                />
              ) : null;
            case "divider":
              return <hr key={i} className="border-gray-200" />;
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}
