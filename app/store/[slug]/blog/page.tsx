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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
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
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Пока нет статей</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/store/${slug}/blog/${post.slug}`}
              className="group rounded-xl border overflow-hidden bg-white hover:shadow-md transition-shadow"
            >
              {post.cover_image ? (
                <img
                  src={post.cover_image}
                  alt={post.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-gray-300" />
                </div>
              )}
              <div className="p-4">
                <h2 className="font-semibold text-lg line-clamp-2 group-hover:text-amber-600 transition-colors">
                  {post.title}
                </h2>
                <p className="text-xs text-gray-400 mt-2">
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
