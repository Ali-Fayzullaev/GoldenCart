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
import { usePublicBlogPosts } from "@/lib/hooks/use-blog-posts";
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
  const { data: blogPosts } = usePublicBlogPosts(store.id);

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
            {blogPosts && blogPosts.length > 0 && (
              <Link
                href={`${baseUrl}/blog`}
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Блог
              </Link>
            )}

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
            {blogPosts && blogPosts.length > 0 && (
              <Link href={`${baseUrl}/blog`} className="block text-sm text-gray-300 py-2" onClick={() => setMobileMenu(false)}>
                Блог
              </Link>
            )}
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
      <footer className="border-t py-6">
        {/* Social links */}
        {(settings?.instagram_url || settings?.telegram_url || settings?.vk_url || settings?.whatsapp_url) && (
          <div className="flex items-center justify-center gap-4 mb-4">
            {settings?.instagram_url && (
              <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849s-.012 3.584-.069 4.849c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849s.013-3.583.07-4.849C2.381 3.924 3.896 2.38 7.151 2.232 8.417 2.175 8.796 2.163 12 2.163M12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12s.014 3.668.072 4.948c.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24s3.668-.014 4.948-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948s-.014-3.667-.072-4.947c-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
              </a>
            )}
            {settings?.telegram_url && (
              <a href={settings.telegram_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
              </a>
            )}
            {settings?.vk_url && (
              <a href={settings.vk_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.525-2.049-1.714-1.033-1.01-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.12-5.339-3.202-2.17-3.042-2.763-5.32-2.763-5.785 0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.864 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.27-1.422 2.18-3.61 2.18-3.61.119-.254.322-.491.762-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.187.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.049.17.475-.085.72-.576.72z" /></svg>
              </a>
            )}
            {settings?.whatsapp_url && (
              <a href={settings.whatsapp_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-500 transition-colors">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              </a>
            )}
          </div>
        )}
        <p className="text-center text-sm opacity-60">
          {store.name} — Работает на{" "}
          <Link href="/" className="underline">
            GoldenCart
          </Link>
        </p>
      </footer>
    </div>
  );
}
