"use client";

import { use } from "react";
import Link from "next/link";
import { BookOpen, ImageIcon } from "lucide-react";
import { useStoreBySlug } from "@/lib/hooks/use-stores";
import { usePublicBlogPosts } from "@/lib/hooks/use-blog-posts";

export default function StoreBlogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: store } = useStoreBySlug(slug);
  const { data: posts, isLoading } = usePublicBlogPosts(store?.id);
  const primaryColor = store?.store_settings?.primary_color || "#f59e0b";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold" style={{ color: primaryColor }}>
        Блог
      </h1>

      {!posts?.length ? (
        <div className="text-center py-20">
          <BookOpen className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="s-muted">Пока нет статей</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/store/${slug}/blog/${post.slug}`}
              className="group rounded-2xl border s-border overflow-hidden shadow-sm s-card hover:shadow-md transition-shadow"
            >
              {post.cover_image ? (
                <img
                  src={post.cover_image}
                  alt={post.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-gray-300" />
                </div>
              )}
              <div className="p-4">
                <h2 className="font-semibold text-lg line-clamp-2 group-hover:text-gray-700 transition-colors">
                  {post.title}
                </h2>
                <p className="text-xs s-muted mt-2">
                  {new Date(post.created_at).toLocaleDateString("ru-RU", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
