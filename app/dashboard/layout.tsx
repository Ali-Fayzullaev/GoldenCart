"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
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
  Moon,
  Sun,
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
  const { theme, setTheme } = useTheme();
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
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-card flex flex-col border-r border-border transition-all duration-200",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-3 h-14 border-b border-border">
          {!collapsed && (
            <Link href="/" className="text-lg font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent truncate">
              ✦ GoldenCart
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
              collapsed && "mx-auto"
            )}
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        {/* Profile */}
        {!collapsed && profile && (
          <div className="px-3 py-2 border-b border-border">
            <p className="text-xs text-muted-foreground truncate">
              {profile.full_name || profile.email}
            </p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1 scrollbar-thin">
          {navGroups.map((group, gi) => {
            const isGroupOpen = !group.label || openGroups[group.label];

            return (
              <div key={gi}>
                {/* Group header */}
                {group.label && !collapsed && (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="w-full flex items-center justify-between px-2 pt-3 pb-1 group"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 group-hover:text-muted-foreground transition-colors">
                      {group.label}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 text-muted-foreground/50 transition-transform",
                        !isGroupOpen && "-rotate-90"
                      )}
                    />
                  </button>
                )}
                {collapsed && group.label && (
                  <div className="border-t border-border mx-2 my-1" />
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
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
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
          <div className="px-3 py-2.5 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center text-primary text-xs font-bold">
                {store.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{store.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{store.slug}</p>
              </div>
            </div>
          </div>
        )}

        {/* Theme toggle + Logout */}
        <div className="px-2 py-2 border-t border-border flex items-center gap-1">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={cn(
              "p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
              collapsed && "mx-auto"
            )}
            title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {!collapsed && (
            <Button
              variant="ghost"
              className="flex-1 justify-start text-muted-foreground hover:text-foreground hover:bg-accent text-xs"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Выйти
            </Button>
          )}
          {collapsed && (
            <Button
              variant="ghost"
              className="hidden"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 bg-background overflow-auto">
        <div className="max-w-6xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
