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
  AlertTriangle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <Store className="h-16 w-16 text-muted-foreground/40 mb-4" />
        <h2 className="text-2xl font-bold mb-2">У вас ещё нет магазина</h2>
        <p className="text-muted-foreground mb-6">
          Создайте свой интернет-магазин прямо сейчас
        </p>
        <Link
          href="/dashboard/store"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
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
      color: "text-blue-600 bg-blue-500/10 dark:text-blue-400 dark:bg-blue-500/15",
    },
    {
      label: "Заказов",
      value: orders?.length || 0,
      icon: ShoppingCart,
      href: "/dashboard/orders",
      color: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/15",
    },
    {
      label: "Покупателей",
      value: customers?.length || 0,
      icon: Users,
      href: "/dashboard/customers",
      color: "text-violet-600 bg-violet-500/10 dark:text-violet-400 dark:bg-violet-500/15",
    },
    {
      label: "Выручка",
      value: formatPrice(totalRevenue),
      icon: Store,
      href: "/dashboard/orders",
      color: "text-primary bg-primary/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Обзор</h1>
          <p className="text-muted-foreground mt-1">Магазин: {store.name}</p>
        </div>
        {analytics && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Сегодня заказов</p>
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
            className="bg-card rounded-xl border border-border p-5 hover:shadow-lg hover:shadow-primary/5 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
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
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-primary">
              Новых заказов: {pendingOrders}
            </p>
            <p className="text-sm text-primary/70">Требуют вашего внимания</p>
          </div>
          <Link
            href="/dashboard/orders"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm"
          >
            Посмотреть
          </Link>
        </div>
      )}

      {/* Low stock alert */}
      {(() => {
        const threshold = store.low_stock_threshold ?? 5;
        const lowStockItems = products?.filter((p) => p.is_active && p.stock <= threshold && p.stock > 0) || [];
        const outOfStockItems = products?.filter((p) => p.is_active && p.stock === 0) || [];
        if (!lowStockItems.length && !outOfStockItems.length) return null;
        return (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <p className="font-medium text-red-800">
                  {outOfStockItems.length > 0 && `Нет в наличии: ${outOfStockItems.length}`}
                  {outOfStockItems.length > 0 && lowStockItems.length > 0 && " · "}
                  {lowStockItems.length > 0 && `Заканчивается: ${lowStockItems.length}`}
                </p>
              </div>
              <Link
                href="/dashboard/products"
                className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
              >
                К товарам
              </Link>
            </div>
            <div className="space-y-1.5">
              {outOfStockItems.slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  <span className="text-red-700 truncate">{p.name}</span>
                  <span className="text-red-500 font-medium ml-auto shrink-0">0 шт.</span>
                </div>
              ))}
              {lowStockItems.slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  <span className="text-red-700 truncate">{p.name}</span>
                  <span className="text-primary font-medium ml-auto shrink-0">{p.stock} шт.</span>
                </div>
              ))}
              {(outOfStockItems.length + lowStockItems.length > 6) && (
                <p className="text-xs text-red-400">
                  и ещё {outOfStockItems.length + lowStockItems.length - 6} товар(ов)...
                </p>
              )}
            </div>
          </div>
        );
      })()}

      {/* Analytics section */}
      {analytics && orders && orders.length > 0 && (
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Revenue chart */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
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

            {/* Area chart */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.dailyRevenue} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}к` : String(v)}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-popover)",
                      borderColor: "var(--color-border)",
                      borderRadius: "0.5rem",
                      fontSize: "0.75rem",
                    }}
                    formatter={(value) => [formatPrice(Number(value)), "Выручка"]}
                    labelFormatter={(label) => String(label)}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Side stats */}
          <div className="space-y-4">
            {/* Average check */}
            <div className="bg-card rounded-xl border border-border p-5">
              <p className="text-sm text-muted-foreground">Средний чек</p>
              <p className="text-2xl font-bold mt-1">
                {formatPrice(analytics.avgCheck)}
              </p>
            </div>

            {/* Order status donut */}
            <div className="bg-card rounded-xl border border-border p-5">
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
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Топ товаров</h2>
            <div className="space-y-3">
              {analytics.topProducts.map(([name, count], i) => (
                <div key={name} className="flex items-center gap-3">
                  <span
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      i === 0
                        ? "bg-primary"
                        : i === 1
                          ? "bg-primary/60"
                          : i === 2
                            ? "bg-primary/40"
                            : "bg-muted-foreground/30"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm truncate">{name}</span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {count} шт.
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="bg-card rounded-xl border border-border p-6">
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
              href="/dashboard/store"
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
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{count}</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
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
      className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-accent transition-colors text-center"
    >
      <Icon className="h-6 w-6 text-primary" />
      <span className="text-sm">{label}</span>
    </Link>
  );
}
