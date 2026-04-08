"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingBag,
  ShoppingCart,
  User,
  LogOut,
  Menu,
  X,
  Heart,
  Home,
  ClipboardList,
  Search,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStoreBySlug } from "@/lib/hooks/use-stores";
import { useProfile } from "@/lib/hooks/use-profile";
import { useCartStore } from "@/lib/store/cart-store";
import { usePublicStorePages } from "@/lib/hooks/use-store-pages";
import { usePublicBlogPosts } from "@/lib/hooks/use-blog-posts";
import { createClient } from "@/lib/supabase/client";
import type { StoreWithSettings } from "@/lib/types/database";
import { cn } from "@/lib/utils";

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-[3px] border-gray-200 border-t-gray-800 animate-spin" />
          <p className="text-sm text-gray-400">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-sm border p-8 text-center max-w-sm">
          <ShoppingBag className="h-14 w-14 text-gray-200 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Магазин не найден</h1>
          <p className="text-gray-500 text-sm mb-6">Возможно ссылка устарела или магазин временно недоступен</p>
          <Link href="/">
            <Button className="w-full">На главную</Button>
          </Link>
        </div>
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
  const router = useRouter();
  const settings = store.store_settings;
  const { data: profile } = useProfile();
  const supabase = createClient();
  const cartItems = useCartStore((s) => s.items);
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState("");
  const { data: cmsPages } = usePublicStorePages(store.id);
  const { data: blogPosts } = usePublicBlogPosts(store.id);

  useEffect(() => {
    const count = cartItems
      .filter((i) => i.store_id === store.id)
      .reduce((sum, i) => sum + i.quantity, 0);
    setCartCount(count);
  }, [cartItems, store.id]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMobileMenu(false);
  }, [pathname]);

  const primaryColor = settings?.primary_color || "#f59e0b";
  const secondaryColor = settings?.secondary_color || "#1f2937";
  const bgColor = settings?.background_color || "#fafafa";
  const textColor = settings?.text_color || "#111827";
  const font = settings?.font || "Inter";

  const isLoggedIn = !!profile;
  const isCustomer = profile?.role === "customer";
  const baseUrl = `/store/${store.slug}`;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headerSearch.trim()) return;
    // Navigate to store page — the page reads the search query from URL
    const sp = new URLSearchParams({ q: headerSearch.trim() });
    router.push(`${baseUrl}?${sp.toString()}`);
    setSearchOpen(false);
    setHeaderSearch("");
  };

  const tabItems = [
    { href: baseUrl, icon: Home, label: "Главная", match: (p: string) => p === baseUrl },
    { href: `${baseUrl}/wishlist`, icon: Heart, label: "Избранное", match: (p: string) => p.includes("/wishlist") },
    { href: `${baseUrl}/cart`, icon: ShoppingCart, label: "Корзина", match: (p: string) => p.includes("/cart"), badge: cartCount },
    { href: `${baseUrl}/orders`, icon: ClipboardList, label: "Заказы", match: (p: string) => p.includes("/orders") },
    { href: `${baseUrl}/profile`, icon: User, label: "Профиль", match: (p: string) => p.includes("/profile") },
  ];

  // Derive card/muted colors from background
  const isStoreDark = (() => {
    // Simple luminance check from hex
    const hex = bgColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  })();

  const storeVars = {
    "--store-bg": bgColor,
    "--store-text": textColor,
    "--store-card": isStoreDark ? "rgba(255,255,255,0.08)" : "#ffffff",
    "--store-card-foreground": textColor,
    "--store-muted": isStoreDark ? "rgba(255,255,255,0.5)" : "#6b7280",
    "--store-border": isStoreDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)",
    "--store-hover": isStoreDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
    "--store-input-bg": isStoreDark ? "rgba(255,255,255,0.1)" : "#ffffff",
  } as React.CSSProperties;

  return (
    <div
      style={{ backgroundColor: bgColor, color: textColor, fontFamily: font, ...storeVars }}
      className="min-h-screen flex flex-col"
    >
      {/* Banner */}
      {settings?.banner_url && (
        <div className="relative">
          <img
            src={settings.banner_url}
            alt="Banner"
            className="w-full h-40 md:h-56 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      )}

      {/* Header */}
      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          scrolled ? "shadow-lg backdrop-blur-xl" : "shadow-sm"
        )}
        style={{ backgroundColor: scrolled ? `${secondaryColor}f0` : secondaryColor }}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={baseUrl} className="flex items-center gap-2.5 group">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt={store.name} className="h-9 w-9 rounded-lg object-cover ring-2 ring-white/10" />
            ) : (
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {store.name.charAt(0)}
              </div>
            )}
            <span className="text-lg font-bold text-white group-hover:opacity-90 transition-opacity">
              {store.name}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <StoreNavLink href={baseUrl} active={pathname === baseUrl}>Каталог</StoreNavLink>
            {cmsPages?.map((p) => (
              <StoreNavLink key={p.id} href={`${baseUrl}/page/${p.slug}`} active={pathname.includes(`/page/${p.slug}`)}>
                {p.title}
              </StoreNavLink>
            ))}
            {blogPosts && blogPosts.length > 0 && (
              <StoreNavLink href={`${baseUrl}/blog`} active={pathname.includes("/blog")}>Блог</StoreNavLink>
            )}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all"
              title="Поиск"
            >
              <Search className="h-5 w-5" />
            </button>
            <div className="w-px h-6 bg-white/15 mx-2" />
            {isLoggedIn && isCustomer ? (
              <div className="flex items-center gap-1">
                <Link href={`${baseUrl}/profile`} className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all" title="Профиль" aria-label="Профиль">
                  <User className="h-5 w-5" />
                </Link>
                <Link href={`${baseUrl}/orders`} className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all" title="Заказы" aria-label="Заказы">
                  <ClipboardList className="h-5 w-5" />
                </Link>
                <Link href={`${baseUrl}/wishlist`} className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all" title="Избранное" aria-label="Избранное">
                  <Heart className="h-5 w-5" />
                </Link>
                <Link href={`${baseUrl}/cart`} className="relative p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all" title="Корзина" aria-label="Корзина">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-5 min-w-5 flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1" style={{ backgroundColor: primaryColor }}>
                      {cartCount}
                    </span>
                  )}
                </Link>
                <button onClick={handleLogout} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/10 transition-all" title="Выйти" aria-label="Выйти">
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link href={`${baseUrl}/login`}>
                <Button size="sm" className="text-white font-medium px-5 hover:opacity-90 transition-opacity" style={{ backgroundColor: primaryColor }}>
                  Войти
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobile */}
          <div className="flex md:hidden items-center gap-2">
            <Link href={`${baseUrl}/cart`} className="relative p-2 text-white" aria-label="Корзина">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4.5 min-w-4.5 flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1" style={{ backgroundColor: primaryColor }}>
                  {cartCount}
                </span>
              )}
            </Link>
            <button className="p-2 text-white" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Меню">
              {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenu && (
          <div className="md:hidden border-t border-white/10 animate-in slide-in-from-top-2 duration-200" style={{ backgroundColor: secondaryColor }}>
            <div className="container mx-auto px-4 py-3 space-y-1">
              <MobileLink href={baseUrl}>Каталог</MobileLink>
              {cmsPages?.map((p) => (
                <MobileLink key={p.id} href={`${baseUrl}/page/${p.slug}`}>{p.title}</MobileLink>
              ))}
              {blogPosts && blogPosts.length > 0 && (
                <MobileLink href={`${baseUrl}/blog`}>Блог</MobileLink>
              )}
              {isLoggedIn && isCustomer ? (
                <>
                  <div className="border-t border-white/10 my-2" />
                  <MobileLink href={`${baseUrl}/profile`}>Профиль</MobileLink>
                  <MobileLink href={`${baseUrl}/orders`}>Мои заказы</MobileLink>
                  <MobileLink href={`${baseUrl}/wishlist`}>Избранное</MobileLink>
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                    Выйти
                  </button>
                </>
              ) : (
                <>
                  <div className="border-t border-white/10 my-2" />
                  <Link href={`${baseUrl}/login`} className="block">
                    <Button size="sm" className="w-full text-white" style={{ backgroundColor: primaryColor }}>Войти</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setSearchOpen(false)}>
          <div className="container mx-auto px-4 pt-20" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleHeaderSearch} className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                autoFocus
                type="text"
                placeholder="Поиск товаров..."
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white text-gray-900 text-lg shadow-2xl border-0 outline-none placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Breadcrumbs */}
      {pathname !== baseUrl && (
        <div className="container mx-auto px-4 pt-3">
          <nav className="flex items-center gap-1 text-sm text-gray-400">
            <Link href={baseUrl} className="hover:text-gray-700 transition-colors">Главная</Link>
            {(() => {
              const segments = pathname.replace(baseUrl, "").split("/").filter(Boolean);
              const labels: Record<string, string> = {
                cart: "Корзина",
                checkout: "Оформление",
                orders: "Заказы",
                wishlist: "Избранное",
                profile: "Профиль",
                product: "Товар",
                blog: "Блог",
                page: "Страница",
                compare: "Сравнение",
                login: "Вход",
                register: "Регистрация",
              };
              return segments.map((seg, i) => (
                <span key={i} className="flex items-center gap-1">
                  <ChevronRight className="h-3.5 w-3.5" />
                  {i === segments.length - 1 ? (
                    <span className="text-gray-700 font-medium">{labels[seg] || decodeURIComponent(seg)}</span>
                  ) : (
                    <Link
                      href={`${baseUrl}/${segments.slice(0, i + 1).join("/")}`}
                      className="hover:text-gray-700 transition-colors"
                    >
                      {labels[seg] || decodeURIComponent(seg)}
                    </Link>
                  )}
                </span>
              ));
            })()}
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>

      {/* Footer (desktop only) */}
      <footer className="border-t bg-white/50 backdrop-blur-sm hidden md:block">
        <div className="container mx-auto px-4 py-8">
          {(settings?.instagram_url || settings?.telegram_url || settings?.vk_url || settings?.whatsapp_url) && (
            <div className="flex items-center justify-center gap-3 mb-6">
              {settings?.instagram_url && (
                <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 hover:text-white transition-all">
                  <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849s-.012 3.584-.069 4.849c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849s.013-3.583.07-4.849C2.381 3.924 3.896 2.38 7.151 2.232 8.417 2.175 8.796 2.163 12 2.163M12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12s.014 3.668.072 4.948c.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24s3.668-.014 4.948-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948s-.014-3.667-.072-4.947c-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                </a>
              )}
              {settings?.telegram_url && (
                <a href={settings.telegram_url} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-blue-500 hover:text-white transition-all">
                  <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
                </a>
              )}
              {settings?.vk_url && (
                <a href={settings.vk_url} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-blue-600 hover:text-white transition-all">
                  <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor"><path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.525-2.049-1.714-1.033-1.01-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.12-5.339-3.202-2.17-3.042-2.763-5.32-2.763-5.785 0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.864 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.27-1.422 2.18-3.61 2.18-3.61.119-.254.322-.491.762-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.187.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.049.17.475-.085.72-.576.72z" /></svg>
                </a>
              )}
              {settings?.whatsapp_url && (
                <a href={settings.whatsapp_url} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-green-500 hover:text-white transition-all">
                  <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                </a>
              )}
            </div>
          )}
          <p className="text-center text-sm opacity-50">
            {store.name} — Работает на{" "}
            <Link href="/" className="underline hover:opacity-80">GoldenCart</Link>
          </p>
        </div>
      </footer>

      {/* Mobile Tab Bar */}
      {isLoggedIn && isCustomer ? (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t">
          <div className="flex items-center justify-around h-16 px-2">
            {tabItems.map((tab) => {
              const active = tab.match(pathname);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all relative",
                    active ? "text-gray-900" : "text-gray-400"
                  )}
                >
                  <div className="relative">
                    <tab.icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                    {tab.badge && tab.badge > 0 ? (
                      <span
                        className="absolute -top-1.5 -right-2 h-4 min-w-4 flex items-center justify-center rounded-full text-[9px] font-bold text-white px-0.5"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {tab.badge}
                      </span>
                    ) : null}
                  </div>
                  <span className={cn("text-[10px]", active ? "font-semibold" : "font-medium")}>
                    {tab.label}
                  </span>
                  {active && (
                    <div className="absolute -top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full" style={{ backgroundColor: primaryColor }} />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t">
          <div className="flex items-center justify-center h-16 px-4 gap-3">
            <Link href={`${baseUrl}/login`} className="flex-1">
              <Button className="w-full text-white font-medium" style={{ backgroundColor: primaryColor }}>
                Войти
              </Button>
            </Link>
            <Link href={`${baseUrl}/cart`} className="relative h-11 w-11 rounded-xl border flex items-center justify-center text-gray-600">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 h-4.5 min-w-4.5 flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1"
                  style={{ backgroundColor: primaryColor }}
                >
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}

function StoreNavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "text-sm px-3 py-1.5 rounded-lg transition-all",
        active ? "text-white bg-white/15 font-medium" : "text-gray-300 hover:text-white hover:bg-white/10"
      )}
    >
      {children}
    </Link>
  );
}

function MobileLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
      {children}
    </Link>
  );
}
