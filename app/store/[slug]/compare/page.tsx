"use client";

import { use } from "react";
import { GitCompareArrows, X, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStoreBySlug } from "@/lib/hooks/use-stores";
import { useCompareStore } from "@/lib/store/compare-store";
import { formatPrice } from "@/lib/helpers";

export default function ComparePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: store } = useStoreBySlug(slug);
  const items = useCompareStore((s) => s.items).filter(
    (i) => store && i.store_id === store.id
  );
  const removeFromCompare = useCompareStore((s) => s.removeFromCompare);
  const clearCompare = useCompareStore((s) => s.clearCompare);
  const primaryColor = store?.store_settings?.primary_color || "#f59e0b";

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <GitCompareArrows className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">Нет товаров для сравнения</p>
        <p className="text-gray-400 text-sm mt-1">
          Добавьте товары через каталог магазина
        </p>
        <a
          href={`/store/${slug}`}
          className="inline-block mt-4 text-sm font-medium hover:underline"
          style={{ color: primaryColor }}
        >
          ← Перейти в каталог
        </a>
      </div>
    );
  }

  // Собираем все уникальные имена вариантов
  const allVariantNames = Array.from(
    new Set(
      items.flatMap((p) => (p.variants || []).map((v) => v.name))
    )
  );

  const rows: { label: string; values: (string | React.ReactNode)[] }[] = [
    {
      label: "Цена",
      values: items.map((p) => (
        <span key={p.product_id} className="font-bold" style={{ color: primaryColor }}>
          {formatPrice(p.price)}
        </span>
      )),
    },
    {
      label: "Категория",
      values: items.map((p) => p.category),
    },
    {
      label: "В наличии",
      values: items.map((p) =>
        p.stock > 0 ? (
          <span key={p.product_id} className="text-green-600">{p.stock} шт.</span>
        ) : (
          <span key={p.product_id} className="text-red-500">Нет</span>
        )
      ),
    },
    ...allVariantNames.map((vName) => ({
      label: vName,
      values: items.map((p) => {
        const variant = (p.variants || []).find((v) => v.name === vName);
        return variant ? variant.values.join(", ") : "—";
      }),
    })),
    {
      label: "Описание",
      values: items.map((p) =>
        p.description ? (
          <span key={p.product_id} className="text-sm text-gray-600 line-clamp-4">{p.description}</span>
        ) : (
          "—"
        )
      ),
    },
  ];

  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCompareArrows className="h-6 w-6 text-blue-500" />
          <h1 className="text-2xl font-bold">Сравнение товаров</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={clearCompare}>
          Очистить всё
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="w-40" />
              {items.map((p) => (
                <th
                  key={p.product_id}
                  className="p-3 text-center min-w-[200px] border-b"
                >
                  <div className="relative inline-block">
                    <button
                      onClick={() => removeFromCompare(p.product_id)}
                      className="absolute -top-1 -right-1 bg-gray-100 rounded-full p-0.5 hover:bg-red-100"
                    >
                      <X className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                    <a href={`/store/${slug}/product/${p.product_id}`}>
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-32 h-32 object-cover rounded-lg mx-auto mb-2"
                        />
                      ) : (
                        <div className="w-32 h-32 bg-gray-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <ShoppingBag className="h-8 w-8 text-gray-300" />
                        </div>
                      )}
                      <p className="font-medium text-sm line-clamp-2">{p.name}</p>
                    </a>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b">
                <td className="p-3 text-sm font-medium text-gray-500 bg-gray-50">
                  {row.label}
                </td>
                {row.values.map((val, i) => (
                  <td key={i} className="p-3 text-sm text-center">
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
