import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/lib/providers/query-provider";
import { ThemeProvider } from "@/lib/providers/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GoldenCart — Создайте свой интернет-магазин",
  description:
    "SaaS-платформа для создания интернет-магазинов. Регистрируйтесь, настраивайте дизайн, добавляйте товары и делитесь ссылкой с покупателями.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/favicon.png",
    apple: "/icons/apple-touch.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
  },
  openGraph: {
    title: "GoldenCart — Создайте свой интернет-магазин",
    description:
      "SaaS-платформа для создания интернет-магазинов. Регистрируйтесь, настраивайте дизайн, добавляйте товары и делитесь ссылкой с покупателями.",
    images: [{ url: "/icons/og-img-1200-630.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#f59e0b" />
      </head>
      <body className="min-h-full flex flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js')})}`
          }}
        />
        <ThemeProvider>
          <QueryProvider>
            {children}
            <Toaster richColors position="top-center" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
