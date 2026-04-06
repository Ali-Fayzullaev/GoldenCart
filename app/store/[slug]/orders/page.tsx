"use client";

import { use } from "react";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useStoreBySlug } from "@/lib/hooks/use-stores";
import { useCustomerOrders } from "@/lib/hooks/use-orders";
import { formatPrice, getStatusLabel, getStatusColor } from "@/lib/helpers";

export default function CustomerOrdersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: store } = useStoreBySlug(slug);
  const { data: orders, isLoading } = useCustomerOrders(store?.id);

  const primaryColor = store?.store_settings?.primary_color || "#f59e0b";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!orders?.length) {
    return (
      <div className="text-center py-20">
        <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Заказов пока нет</h2>
        <p className="text-gray-500">Сделайте свой первый заказ!</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-4">
      <h1 className="text-2xl font-bold">Мои заказы</h1>

      {orders.map((order) => (
        <div key={order.id} className="bg-white rounded-xl border overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b">
            <div>
              <p className="text-sm text-gray-500">
                {new Date(order.created_at).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="font-mono text-xs text-gray-400">
                #{order.id.slice(0, 8)}
              </p>
            </div>
            <Badge className={getStatusColor(order.status)}>
              {getStatusLabel(order.status)}
            </Badge>
          </div>

          <div className="p-4 space-y-2">
            {order.order_items?.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {item.products?.images?.[0] && (
                    <img
                      src={item.products.images[0]}
                      alt=""
                      className="h-8 w-8 rounded object-cover"
                    />
                  )}
                  <span>{item.products?.name}</span>
                  <span className="text-gray-400">× {item.quantity}</span>
                </div>
                <span className="font-medium">
                  {formatPrice(item.price_at_time * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div
            className="px-4 py-3 flex justify-between font-bold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <span>Итого</span>
            <span>{formatPrice(order.total_amount)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
