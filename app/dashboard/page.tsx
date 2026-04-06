"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Store,
  Package,
  ShoppingCart,
  Users,
  Palette,
  Share2,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Tag,
} from "lucide-react";
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

  // Аналитика
  const analytics = useMemo(() => {
    if (!orders?.length) return null;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Доход за последние 7 дней
    const thisWeekOrders = orders.filter(
      (o) => new Date(o.created_at) >= weekAgo && o.status !== "cancelled"
    );
    const lastWeekOrders = orders.filter(
      (o) =>
        new Date(o.created_at) >= twoWeeksAgo &&
        new Date(o.created_at) < weekAgo &&
        o.status !== "cancelled"
    );

    const thisWeekRevenue = thisWeekOrders.reduce(
      (s, o) => s + o.total_amount,
      0
    );
    const lastWeekRevenue = lastWeekOrders.reduce(
      (s, o) => s + o.total_amount,
      0
    );
    const revenueChange =
      lastWeekRevenue > 0
        ? Math.round(
            ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100
          )
        : thisWeekRevenue > 0
          ? 100
          : 0;

    // Доход по дням (7 дней)
    const dailyRevenue: { date: string; amount: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000);
      const dayOrders = orders.filter(
        (o) =>
          new Date(o.created_at) >= day &&
          new Date(o.created_at) < nextDay &&
          o.status !== "cancelled"
      );
      dailyRevenue.push({
        date: day.toLocaleDateString("ru-RU", {
          weekday: "short",
          day: "numeric",
        }),
        amount: dayOrders.reduce((s, o) => s + o.total_amount, 0),
        orders: dayOrders.length,
      });
    }

    // Статусы заказов
    const statusCounts = {
      pending: orders.filter((o) => o.status === "pending").length,
      confirmed: orders.filter((o) => o.status === "confirmed").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    };

    // Средний чек
    const completedOrders = orders.filter((o) => o.status !== "cancelled");
    const avgCheck =
      completedOrders.length > 0
        ? completedOrders.reduce((s, o) => s + o.total_amount, 0) /
          completedOrders.length
        : 0;

    // Топ-5 товаров (по кол-ву в заказах)
    const productOrderCount: Record<string, number> = {};
    orders.forEach((o) => {
      if ("order_items" in o && Array.isArray(o.order_items)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        o.order_items.forEach((item: any) => {
          const name = item.products?.name || "Неизвестно";
          productOrderCount[name] =
            (productOrderCount[name] || 0) + item.quantity;
        });
      }
    });
    const topProducts = Object.entries(productOrderCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return {
      thisWeekRevenue,
      revenueChange,
      dailyRevenue,
      statusCounts,
      avgCheck,
      topProducts,
      todayOrders: orders.filter((o) => new Date(o.created_at) >= today).length,
    };
  }, [orders]);

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
    orders
      ?.filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.total_amount, 0) || 0;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Обзор</h1>
          <p className="text-gray-500 mt-1">Магазин: {store.name}</p>
        </div>
        {analytics && (
          <div className="text-right">
            <p className="text-sm text-gray-500">Сегодня заказов</p>
            <p className="text-2xl font-bold">{analytics.todayOrders}</p>
          </div>
        )}
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

      {/* Analytics section */}
      {analytics && orders && orders.length > 0 && (
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Revenue chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Выручка за неделю</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold">
                    {formatPrice(analytics.thisWeekRevenue)}
                  </span>
                  {analytics.revenueChange !== 0 && (
                    <span
                      className={`flex items-center text-sm font-medium px-2 py-0.5 rounded ${
                        analytics.revenueChange > 0
                          ? "text-green-700 bg-green-50"
                          : "text-red-700 bg-red-50"
                      }`}
                    >
                      {analytics.revenueChange > 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {analytics.revenueChange > 0 ? "+" : ""}
                      {analytics.revenueChange}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bar chart */}
            <div className="flex items-end gap-2 h-40">
              {analytics.dailyRevenue.map((day, i) => {
                const maxAmount = Math.max(
                  ...analytics.dailyRevenue.map((d) => d.amount),
                  1
                );
                const height = Math.max((day.amount / maxAmount) * 100, 4);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-500 font-medium">
                      {day.amount > 0 ? formatPrice(day.amount) : ""}
                    </span>
                    <div
                      className="w-full rounded-t-md bg-amber-400 hover:bg-amber-500 transition-colors cursor-default relative group"
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {day.orders} заказ(ов)
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{day.date}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Side stats */}
          <div className="space-y-4">
            {/* Average check */}
            <div className="bg-white rounded-xl border p-5">
              <p className="text-sm text-gray-500">Средний чек</p>
              <p className="text-2xl font-bold mt-1">
                {formatPrice(analytics.avgCheck)}
              </p>
            </div>

            {/* Order status donut */}
            <div className="bg-white rounded-xl border p-5">
              <h3 className="text-sm font-semibold mb-3">Статусы заказов</h3>
              <div className="space-y-2">
                <StatusBar
                  label="Новые"
                  count={analytics.statusCounts.pending}
                  total={orders.length}
                  color="bg-yellow-400"
                />
                <StatusBar
                  label="Подтверждённые"
                  count={analytics.statusCounts.confirmed}
                  total={orders.length}
                  color="bg-blue-400"
                />
                <StatusBar
                  label="Отправленные"
                  count={analytics.statusCounts.shipped}
                  total={orders.length}
                  color="bg-indigo-400"
                />
                <StatusBar
                  label="Доставленные"
                  count={analytics.statusCounts.delivered}
                  total={orders.length}
                  color="bg-green-400"
                />
                <StatusBar
                  label="Отменённые"
                  count={analytics.statusCounts.cancelled}
                  total={orders.length}
                  color="bg-red-400"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top products & Quick actions */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top products */}
        {analytics && analytics.topProducts.length > 0 && (
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Топ товаров</h2>
            <div className="space-y-3">
              {analytics.topProducts.map(([name, count], i) => (
                <div key={name} className="flex items-center gap-3">
                  <span
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      i === 0
                        ? "bg-amber-500"
                        : i === 1
                          ? "bg-gray-400"
                          : i === 2
                            ? "bg-orange-400"
                            : "bg-gray-300"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm truncate">{name}</span>
                  <span className="text-sm font-medium text-gray-500">
                    {count} шт.
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Быстрые действия</h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction
              href="/dashboard/products"
              icon={Package}
              label="Добавить товар"
            />
            <QuickAction
              href="/dashboard/design"
              icon={Palette}
              label="Настроить дизайн"
            />
            <QuickAction
              href="/dashboard/promo"
              icon={Tag}
              label="Промокоды"
            />
            <QuickAction
              href="/dashboard/share"
              icon={Share2}
              label="Поделиться"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{count}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
        />
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
