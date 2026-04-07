"use client";

import { use } from "react";
import { ShoppingCart, Package, CheckCircle2, Truck, MapPin, XCircle, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStoreBySlug } from "@/lib/hooks/use-stores";
import { useCustomerOrders } from "@/lib/hooks/use-orders";
import { useCartStore } from "@/lib/store/cart-store";
import { formatPrice, getStatusLabel, getStatusColor } from "@/lib/helpers";
import { toast } from "sonner";
import type { Order } from "@/lib/types/database";

const TIMELINE_STEPS: {
  status: Order["status"];
  label: string;
  icon: typeof Package;
}[] = [
  { status: "pending", label: "Оформлен", icon: Package },
  { status: "confirmed", label: "Подтверждён", icon: CheckCircle2 },
  { status: "shipped", label: "Отправлен", icon: Truck },
  { status: "delivered", label: "Доставлен", icon: MapPin },
];

function getStepIndex(status: Order["status"]): number {
  if (status === "cancelled") return -1;
  return TIMELINE_STEPS.findIndex((s) => s.status === status);
}

function OrderTimeline({
  status,
  primaryColor,
}: {
  status: Order["status"];
  primaryColor: string;
}) {
  const currentIdx = getStepIndex(status);
  const isCancelled = status === "cancelled";

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 py-3 px-4 bg-red-50 rounded-lg">
        <XCircle className="h-5 w-5 text-red-500" />
        <span className="text-sm font-medium text-red-600">Заказ отменён</span>
      </div>
    );
  }

  return (
    <div className="py-3 px-4">
      <div className="flex items-center justify-between relative">
        {/* Линия фона */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-gray-200" />
        {/* Линия прогресса */}
        <div
          className="absolute top-4 left-6 h-0.5 transition-all duration-500"
          style={{
            backgroundColor: primaryColor,
            width: `calc(${(currentIdx / (TIMELINE_STEPS.length - 1)) * 100}% - 48px)`,
          }}
        />

        {TIMELINE_STEPS.map((step, idx) => {
          const isCompleted = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          const Icon = step.icon;
          return (
            <div key={step.status} className="flex flex-col items-center z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isCompleted
                    ? "text-white"
                    : "bg-gray-200 text-gray-400"
                } ${isCurrent ? "ring-2 ring-offset-2" : ""}`}
                style={
                  isCompleted
                    ? { backgroundColor: primaryColor }
                    : {}
                }
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={`text-xs mt-1.5 ${
                  isCompleted ? "font-medium" : "text-gray-400"
                }`}
                style={isCompleted ? { color: primaryColor } : {}}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CustomerOrdersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: store } = useStoreBySlug(slug);
  const { data: orders, isLoading } = useCustomerOrders(store?.id);
  const addItem = useCartStore((s) => s.addItem);

  const primaryColor = store?.store_settings?.primary_color || "#f59e0b";

  const handleRepeatOrder = (order: typeof orders extends (infer T)[] | undefined ? T : never) => {
    if (!order?.order_items?.length || !store) return;
    for (const item of order.order_items) {
      addItem({
        product_id: item.product_id,
        store_id: store.id,
        name: item.products?.name || "Товар",
        price: item.price_at_time,
        image: item.products?.images?.[0] || null,
      }, item.quantity);
    }
    toast.success(`${order.order_items.length} товар(ов) добавлено в корзину`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400" />
      </div>
    );
  }

  if (!orders?.length) {
    return (
      <div className="text-center py-20">
        <ShoppingCart className="h-16 w-16 text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Заказов пока нет</h2>
        <p className="text-gray-500">Сделайте свой первый заказ!</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-4">
      <h1 className="text-2xl font-bold">Мои заказы</h1>

      {orders.map((order) => (
        <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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

          <OrderTimeline status={order.status} primaryColor={primaryColor} />

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
            className="px-4 py-3 flex justify-between items-center font-bold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <span>Итого</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleRepeatOrder(order)}
                className="flex items-center gap-1 text-sm font-normal opacity-90 hover:opacity-100 transition-opacity"
                title="Повторить заказ"
              >
                <RotateCcw className="h-4 w-4" />
                Повторить
              </button>
              <span>{formatPrice(order.total_amount)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
