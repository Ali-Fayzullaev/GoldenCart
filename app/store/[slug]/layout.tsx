"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  ShoppingCart,
  User,
  LogOut,
  Menu,
  X,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStoreBySlug } from "@/lib/hooks/use-stores";
import { useProfile } from "@/lib/hooks/use-profile";
import { useCartStore } from "@/lib/store/cart-store";
import { usePublicStorePages } from "@/lib/hooks/use-store-pages";
import { createClient } from "@/lib/supabase/client";
import type { StoreWithSettings } from "@/lib/types/database";

export default function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: store, isLoading, error } = useStoreBySlug(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Магазин не найден</h1>
        <p className="text-gray-500 mb-4">Возможно ссылка устарела</p>
        <Link href="/">
          <Button>На главную</Button>
        </Link>
      </div>
    );
  }

  return <StoreShell store={store}>{children}</StoreShell>;
}

function StoreShell({
  store,
  children,
}: {
  store: StoreWithSettings;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const settings = store.store_settings;
  const { data: profile } = useProfile();
  const supabase = createClient();
  const getStoreItemCount = useCartStore((s) => s.getStoreItemCount);
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const { data: cmsPages } = usePublicStorePages(store.id);

  useEffect(() => {
    setCartCount(getStoreItemCount(store.id));
  }, [getStoreItemCount, store.id]);

  const primaryColor = settings?.primary_color || "#f59e0b";
  const secondaryColor = settings?.secondary_color || "#1f2937";
  const bgColor = settings?.background_color || "#ffffff";
  const textColor = settings?.text_color || "#111827";
  const font = settings?.font || "Inter";

  const isLoggedIn = !!profile;
  const isCustomer = profile?.role === "customer";
  const baseUrl = `/store/${store.slug}`;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div style={{ backgroundColor: bgColor, color: textColor, fontFamily: font }} className="min-h-screen flex flex-col">
      {/* Banner */}
      {settings?.banner_url && (
        <img
          src={settings.banner_url}
          alt="Banner"
          className="w-full h-40 md:h-56 object-cover"
        />
      )}

      {/* Header */}
      <header style={{ backgroundColor: secondaryColor }} className="sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={baseUrl} className="flex items-center gap-2">
            {settings?.logo_url && (
              <img src={settings.logo_url} alt="" className="h-8 w-8 rounded" />
            )}
            <span className="text-lg font-bold text-white">{store.name}</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-4">
            <Link
              href={baseUrl}
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Каталог
            </Link>
            {cmsPages?.map((p) => (
              <Link
                key={p.id}
                href={`${baseUrl}/page/${p.slug}`}
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                {p.title}
              </Link>
            ))}

            {isLoggedIn && isCustomer ? (
              <>
                <Link href={`${baseUrl}/orders`} className="text-sm text-gray-300 hover:text-white">
                  Мои заказы
                </Link>
                <Link href={`${baseUrl}/wishlist`} className="text-gray-300 hover:text-white">
                  <Heart className="h-5 w-5" />
                </Link>
                <Link href={`${baseUrl}/cart`} className="relative text-gray-300 hover:text-white">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <Badge
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {cartCount}
                    </Badge>
                  )}
                </Link>
                <button onClick={handleLogout} className="text-gray-300 hover:text-white">
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <Link href={`${baseUrl}/login`}>
                <Button size="sm" style={{ backgroundColor: primaryColor }} className="text-white hover:opacity-90">
                  Войти
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-white"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            {mobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden border-t border-white/10 p-4 space-y-2" style={{ backgroundColor: secondaryColor }}>
            <Link href={baseUrl} className="block text-sm text-gray-300 py-2" onClick={() => setMobileMenu(false)}>
              Каталог
            </Link>
            {cmsPages?.map((p) => (
              <Link
                key={p.id}
                href={`${baseUrl}/page/${p.slug}`}
                className="block text-sm text-gray-300 py-2"
                onClick={() => setMobileMenu(false)}
              >
                {p.title}
              </Link>
            ))}
            {isLoggedIn && isCustomer ? (
              <>
                <Link href={`${baseUrl}/orders`} className="block text-sm text-gray-300 py-2" onClick={() => setMobileMenu(false)}>
                  Мои заказы
                </Link>
                <Link href={`${baseUrl}/wishlist`} className="block text-sm text-gray-300 py-2" onClick={() => setMobileMenu(false)}>
                  Избранное
                </Link>
                <Link href={`${baseUrl}/cart`} className="block text-sm text-gray-300 py-2" onClick={() => setMobileMenu(false)}>
                  Корзина ({cartCount})
                </Link>
                <button onClick={handleLogout} className="block text-sm text-gray-300 py-2">
                  Выйти
                </button>
              </>
            ) : (
              <Link href={`${baseUrl}/login`} className="block" onClick={() => setMobileMenu(false)}>
                <Button size="sm" className="w-full" style={{ backgroundColor: primaryColor }}>
                  Войти
                </Button>
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm opacity-60">
        {store.name} — Работает на{" "}
        <Link href="/" className="underline">
          GoldenCart
        </Link>
      </footer>
    </div>
  );
}
