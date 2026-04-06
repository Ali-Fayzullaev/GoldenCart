"use client";

import { use } from "react";
import { FileText } from "lucide-react";
import { useStoreBySlug } from "@/lib/hooks/use-stores";
import { useStorePage } from "@/lib/hooks/use-store-pages";
import type { PageBlock } from "@/lib/types/database";

export default function StorePageView({
  params,
}: {
  params: Promise<{ slug: string; pageSlug: string }>;
}) {
  const { slug, pageSlug } = use(params);
  const { data: store } = useStoreBySlug(slug);
  const { data: page, isLoading } = useStorePage(store?.id, pageSlug);

  const primaryColor = store?.store_settings?.primary_color || "#f59e0b";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="text-center py-20">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Страница не найдена</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold" style={{ color: primaryColor }}>
        {page.title}
      </h1>
      <div className="space-y-4">
        {(page.blocks as PageBlock[]).map((block, i) => (
          <RenderBlock key={i} block={block} />
        ))}
      </div>
    </div>
  );
}

function RenderBlock({ block }: { block: PageBlock }) {
  switch (block.type) {
    case "heading":
      return <h2 className="text-2xl font-bold">{block.content}</h2>;
    case "text":
      return (
        <p className="text-gray-700 whitespace-pre-line leading-relaxed">
          {block.content}
        </p>
      );
    case "image":
      return block.content ? (
        <img
          src={block.content}
          alt=""
          className="w-full rounded-xl max-h-[500px] object-cover"
        />
      ) : null;
    case "divider":
      return <hr className="border-gray-200" />;
    default:
      return null;
  }
}
