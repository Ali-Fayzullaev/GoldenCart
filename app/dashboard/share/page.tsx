"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMyStore } from "@/lib/hooks/use-stores";
import { toast } from "sonner";

export default function SharePage() {
  const { data: store, isLoading } = useMyStore();
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Сначала создайте магазин</p>
      </div>
    );
  }

  const storeUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/store/${store.slug}`
      : `/store/${store.slug}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    toast.success("Ссылка скопирована!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Поделиться магазином</h1>

      {/* Store link */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-1">Ссылка на ваш магазин</h2>
          <p className="text-sm text-gray-500">
            Поделитесь этой ссылкой с покупателями. Они смогут зарегистрироваться,
            просматривать товары и делать заказы.
          </p>
        </div>

        <div className="flex gap-2">
          <Input value={storeUrl} readOnly className="font-mono text-sm" />
          <Button onClick={handleCopy} variant="outline" className="shrink-0">
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <a href={storeUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="shrink-0">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </div>

      {/* Share options */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Способы поделиться</h2>

        <div className="grid gap-3">
          <ShareButton
            label="Telegram"
            url={`https://t.me/share/url?url=${encodeURIComponent(storeUrl)}&text=${encodeURIComponent(`Загляните в мой магазин "${store.name}"!`)}`}
          />
          <ShareButton
            label="WhatsApp"
            url={`https://wa.me/?text=${encodeURIComponent(`Загляните в мой магазин "${store.name}"! ${storeUrl}`)}`}
          />
          <ShareButton
            label="VK"
            url={`https://vk.com/share.php?url=${encodeURIComponent(storeUrl)}&title=${encodeURIComponent(store.name)}`}
          />
        </div>
      </div>

      {/* QR hint */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Share2 className="h-5 w-5 text-amber-500 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Совет</p>
            <p className="text-sm text-amber-700 mt-1">
              Разместите ссылку на магазин в вашем Instagram, Telegram-канале
              или на визитках. Покупатели перейдут по ссылке, зарегистрируются
              и смогут делать заказы.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShareButton({ label, url }: { label: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
    >
      <span>{label}</span>
      <ExternalLink className="h-4 w-4 text-gray-400" />
    </a>
  );
}
