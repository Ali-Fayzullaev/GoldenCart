import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ProductDetailClient from "./product-client";

type Props = {
  params: Promise<{ slug: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("name, description, price, images")
    .eq("id", id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = product as any;
  if (!p) {
    return { title: "Товар не найден" };
  }

  const name: string = p.name;
  const description: string = p.description
    ? p.description.slice(0, 160)
    : `Купить ${name}`;
  const images: string[] = (p.images as string[]) || [];

  return {
    title: name,
    description,
    openGraph: {
      title: name,
      description,
      type: "website",
      ...(images.length ? { images: [images[0]] } : {}),
    },
  };
}

export default function ProductPage({ params }: Props) {
  return <ProductDetailClient params={params} />;
}