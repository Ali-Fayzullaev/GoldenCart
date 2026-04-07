"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingCart,
  Users,
  Palette,
  LogOut,
  Tag,
  ImageIcon,
  FolderTree,
  Truck,
  MessageSquare,
  BookOpen,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/hooks/use-profile";
import { useMyStore } from "@/lib/hooks/use-stores";
import { cn } from "@/lib/utils";

type NavGroup = {
  label: string;
  items: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
};

const navGroups: NavGroup[] = [
  {
    label: "",
    items: [
      { href: "/dashboard", label: "Обзор", icon: LayoutDashboard },
      { href: "/dashboard/store", label: "Мой магазин", icon: Store },
    ],
  },
  {
    label: "Каталог",
    items: [
      { href: "/dashboard/products", label: "Товары", icon: Package },
      { href: "/dashboard/categories", label: "Категории", icon: FolderTree },
    ],
  },
  {
    label: "Продажи",
    items: [
      { href: "/dashboard/orders", label: "Заказы", icon: ShoppingCart },
      { href: "/dashboard/shipping", label: "Доставка", icon: Truck },
      { href: "/dashboard/promo", label: "Промокоды", icon: Tag },
      { href: "/dashboard/customers", label: "Покупатели", icon: Users },
    ],
  },
  {
    label: "Контент",
    items: [
      { href: "/dashboard/blog", label: "Блог", icon: BookOpen },
      { href: "/dashboard/banners", label: "Баннеры", icon: ImageIcon },
      { href: "/dashboard/reviews", label: "Отзывы", icon: MessageSquare },
    ],
  },
  {
    label: "Оформление",
    items: [
      { href: "/dashboard/design", label: "Дизайн", icon: Palette },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { data: profile } = useProfile();
  const { data: store } = useMyStore();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navGroups.forEach((g) => {
      if (g.label) initial[g.label] = true;
    });
    return initial;
  });

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-gray-950 text-white flex flex-col border-r border-gray-800 transition-all duration-200",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-3 h-14 border-b border-gray-800">
          {!collapsed && (
            <Link href="/" className="text-lg font-bold text-amber-400 truncate">
              🛒 GoldenCart
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors",
              collapsed && "mx-auto"
            )}
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        {/* Profile */}
        {!collapsed && profile && (
          <div className="px-3 py-2 border-b border-gray-800">
            <p className="text-xs text-gray-500 truncate">
              {profile.full_name || profile.email}
            </p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1 scrollbar-thin">
          {navGroups.map((group, gi) => {
            const isGroupOpen = !group.label || openGroups[group.label];
            const hasActive = group.items.some(
              (item) =>
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href))
            );

            return (
              <div key={gi}>
                {/* Group header */}
                {group.label && !collapsed && (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="w-full flex items-center justify-between px-2 pt-3 pb-1 group"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 group-hover:text-gray-400 transition-colors">
                      {group.label}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 text-gray-600 transition-transform",
                        !isGroupOpen && "-rotate-90"
                      )}
                    />
                  </button>
                )}
                {collapsed && group.label && (
                  <div className="border-t border-gray-800 mx-2 my-1" />
                )}

                {/* Group items */}
                {(isGroupOpen || collapsed) &&
                  group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/dashboard" && pathname.startsWith(item.href));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg text-[13px] transition-all",
                          collapsed ? "justify-center px-0 py-2 mx-auto w-10 h-10" : "px-2.5 py-1.5",
                          isActive
                            ? "bg-amber-500/15 text-amber-400 font-medium"
                            : "text-gray-400 hover:bg-gray-800/70 hover:text-gray-200"
                        )}
                      >
                        <item.icon className={cn("shrink-0", collapsed ? "h-4.5 w-4.5" : "h-4 w-4")} />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    );
                  })}
              </div>
            );
          })}
        </nav>

        {/* Store info */}
        {store && !collapsed && (
          <div className="px-3 py-2.5 border-t border-gray-800">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold">
                {store.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-300 truncate">{store.name}</p>
                <p className="text-[10px] text-gray-600 truncate">{store.slug}</p>
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="px-2 py-2 border-t border-gray-800">
          <Button
            variant="ghost"
            className={cn(
              "w-full text-gray-500 hover:text-white hover:bg-gray-800 text-xs",
              collapsed ? "justify-center px-0" : "justify-start"
            )}
            onClick={handleLogout}
          >
            <LogOut className={cn("h-4 w-4", !collapsed && "mr-2")} />
            {!collapsed && "Выйти"}
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 bg-gray-50 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
