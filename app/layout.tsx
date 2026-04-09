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
  icons: {
    icon: "/icons/favicon.png",
    apple: "/icons/apple-touch.png",
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
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <QueryProvider>
            {children}
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
