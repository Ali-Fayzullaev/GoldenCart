"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingCart,
  Users,
  Palette,
  Share2,
  LogOut,
  Tag,
  Upload,
  FileText,
  ImageIcon,
  FolderTree,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/hooks/use-profile";
import { useMyStore } from "@/lib/hooks/use-stores";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const navItems = [
  { href: "/dashboard", label: "Обзор", icon: LayoutDashboard },
  { href: "/dashboard/store", label: "Мой магазин", icon: Store },
  { href: "/dashboard/design", label: "Дизайн", icon: Palette },
  { href: "/dashboard/products", label: "Товары", icon: Package },
  { href: "/dashboard/categories", label: "Категории", icon: FolderTree },
  { href: "/dashboard/orders", label: "Заказы", icon: ShoppingCart },
  { href: "/dashboard/promo", label: "Промокоды", icon: Tag },
  { href: "/dashboard/pages", label: "Страницы", icon: FileText },
  { href: "/dashboard/banners", label: "Баннеры", icon: ImageIcon },
  { href: "/dashboard/import", label: "Импорт CSV", icon: Upload },
  { href: "/dashboard/customers", label: "Покупатели", icon: Users },
  { href: "/dashboard/share", label: "Поделиться", icon: Share2 },
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <Link href="/" className="text-xl font-bold text-amber-400">
            🛒 GoldenCart
          </Link>
          {profile && (
            <p className="text-sm text-gray-400 mt-1 truncate">
              {profile.full_name || profile.email}
            </p>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-amber-500/20 text-amber-400"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {store && (
          <div className="p-3 border-t border-gray-700">
            <p className="text-xs text-gray-500 mb-1">Ваш магазин</p>
            <p className="text-sm text-amber-400 truncate">{store.name}</p>
          </div>
        )}

        <div className="p-3 border-t border-gray-700">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Выйти
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 bg-gray-50 p-6 overflow-auto">{children}</main>
    </div>
  );
}
