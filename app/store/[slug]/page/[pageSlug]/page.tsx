"use client";

import { use } from "react";
import { FileText } from "lucide-react";
import { useStoreBySlug } from "@/lib/hooks/use-stores";
import { useStorePage } from "@/lib/hooks/use-store-pages";
import { cn } from "@/lib/utils";
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="text-center py-20">
        <FileText className="h-12 w-12 text-gray-200 mx-auto mb-3" />
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
          <RenderBlock key={i} block={block} primaryColor={primaryColor} />
        ))}
      </div>
    </div>
  );
}

function RenderBlock({ block, primaryColor }: { block: PageBlock; primaryColor: string }) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[block.align || "left"];

  switch (block.type) {
    case "heading": {
      const sizeClass =
        block.size === "lg" ? "text-3xl" : block.size === "sm" ? "text-xl" : "text-2xl";
      return (
        <div className={alignClass}>
          <h2
            className={cn(sizeClass, "font-bold")}
            style={{ color: block.color || undefined }}
          >
            {block.content}
          </h2>
        </div>
      );
    }
    case "text":
      return (
        <div className={alignClass}>
          <p
            className="text-gray-700 whitespace-pre-line leading-relaxed"
            style={{ color: block.color || undefined }}
          >
            {block.content}
          </p>
        </div>
      );
    case "image":
      return block.content ? (
        <div className={alignClass}>
          <img
            src={block.content}
            alt=""
            className="max-w-full rounded-xl max-h-[500px] object-cover inline-block"
          />
        </div>
      ) : null;
    case "button": {
      const sizeClass =
        block.size === "sm"
          ? "text-xs px-3 py-1.5"
          : block.size === "lg"
            ? "text-base px-6 py-3"
            : "text-sm px-4 py-2";
      const btn = (
        <span
          className={cn("inline-block rounded-lg font-medium", sizeClass)}
          style={{
            backgroundColor: block.bgColor || primaryColor,
            color: block.color || "#ffffff",
          }}
        >
          {block.content || "Кнопка"}
        </span>
      );
      return (
        <div className={alignClass}>
          {block.link ? (
            <a href={block.link} target="_blank" rel="noopener noreferrer">
              {btn}
            </a>
          ) : (
            btn
          )}
        </div>
      );
    }
    case "divider":
      return <hr className="border-gray-200" />;
    case "spacer":
      return (
        <div
          className={cn(
            block.size === "sm" ? "h-2" : block.size === "lg" ? "h-16" : "h-8"
          )}
        />
      );
    case "video":
      return block.content ? (
        <div className="aspect-video rounded-xl overflow-hidden">
          <iframe
            src={block.content.replace("watch?v=", "embed/")}
            className="w-full h-full"
            allowFullScreen
          />
        </div>
      ) : null;
    case "quote":
      return (
        <blockquote
          className={cn(
            "border-l-4 pl-4 italic text-gray-600",
            alignClass
          )}
          style={{
            borderColor: primaryColor,
            color: block.color || undefined,
          }}
        >
          {block.content}
        </blockquote>
      );
    case "list": {
      const items = block.content.split("\n").filter(Boolean);
      return (
        <ul className={cn("space-y-1", alignClass)}>
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-gray-700">
              <span style={{ color: primaryColor }} className="mt-1">
                •
              </span>
              <span>{item.replace(/^[•\-*]\s*/, "")}</span>
            </li>
          ))}
        </ul>
      );
    }
    case "html":
      return (
        <div
          className={alignClass}
          dangerouslySetInnerHTML={{ __html: block.content }}
        />
      );
    default:
      return null;
  }
}
