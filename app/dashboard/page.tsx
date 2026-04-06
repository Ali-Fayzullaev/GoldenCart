"use client";

import Link from "next/link";
import { Store, Package, ShoppingCart, Users, Palette, Share2 } from "lucide-react";
import { useMyStore } from "@/lib/hooks/use-stores";
import { useStoreProducts } from "@/lib/hooks/use-products";
import { useSellerOrders } from "@/lib/hooks/use-orders";
import { useStoreCustomers } from "@/lib/hooks/use-customers";
import { formatPrice } from "@/lib/helpers";

export default function DashboardPage() {
  const { data: store, isLoading } = useMyStore();
  const { data: products } = useStoreProducts(store?.id);
  const { data: orders } = useSellerOrders(store?.id);
  const { data: customers } = useStoreCustomers(store?.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <Store className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold mb-2">У вас ещё нет магазина</h2>
        <p className="text-gray-500 mb-6">
          Создайте свой интернет-магазин прямо сейчас
        </p>
        <Link
          href="/dashboard/store"
          className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
        >
          Создать магазин
        </Link>
      </div>
    );
  }

  const totalRevenue =
    orders?.reduce((sum, o) => sum + o.total_amount, 0) || 0;
  const pendingOrders =
    orders?.filter((o) => o.status === "pending").length || 0;

  const stats = [
    {
      label: "Товаров",
      value: products?.length || 0,
      icon: Package,
      href: "/dashboard/products",
      color: "text-blue-500 bg-blue-50",
    },
    {
      label: "Заказов",
      value: orders?.length || 0,
      icon: ShoppingCart,
      href: "/dashboard/orders",
      color: "text-green-500 bg-green-50",
    },
    {
      label: "Покупателей",
      value: customers?.length || 0,
      icon: Users,
      href: "/dashboard/customers",
      color: "text-purple-500 bg-purple-50",
    },
    {
      label: "Выручка",
      value: formatPrice(totalRevenue),
      icon: Store,
      href: "/dashboard/orders",
      color: "text-amber-500 bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Обзор</h1>
        <p className="text-gray-500 mt-1">Магазин: {store.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pending orders alert */}
      {pendingOrders > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-amber-800">
              Новых заказов: {pendingOrders}
            </p>
            <p className="text-sm text-amber-600">Требуют вашего внимания</p>
          </div>
          <Link
            href="/dashboard/orders"
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm"
          >
            Посмотреть
          </Link>
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Быстрые действия</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction href="/dashboard/products" icon={Package} label="Добавить товар" />
          <QuickAction href="/dashboard/design" icon={Palette} label="Настроить дизайн" />
          <QuickAction href="/dashboard/share" icon={Share2} label="Поделиться ссылкой" />
          <QuickAction href="/dashboard/orders" icon={ShoppingCart} label="Заказы" />
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-gray-50 transition-colors text-center"
    >
      <Icon className="h-6 w-6 text-amber-500" />
      <span className="text-sm">{label}</span>
    </Link>
  );
}
