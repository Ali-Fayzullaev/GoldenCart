import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import StoreLayoutClient from "./store-layout-client";

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: store } = await supabase
    .from("stores")
    .select("name, description, store_settings(logo_url)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = store as any;
  if (!s) {
    return { title: "Магазин не найден" };
  }

  const settings = s.store_settings;
  const logo: string | undefined = settings?.logo_url || undefined;

  return {
    title: {
      default: s.name,
      template: `%s | ${s.name}`,
    },
    description: s.description || `Интернет-магазин ${s.name}`,
    openGraph: {
      title: s.name,
      description: s.description || `Интернет-магазин ${s.name}`,
      type: "website",
      ...(logo ? { images: [logo] } : {}),
    },
  };
}

export default function StoreLayout({ children, params }: Props) {
  return <StoreLayoutClient params={params}>{children}</StoreLayoutClient>;
}
