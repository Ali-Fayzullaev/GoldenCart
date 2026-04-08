"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle, Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStoreBySlug } from "@/lib/hooks/use-stores";
import { createClient } from "@/lib/supabase/client";

export default function CheckoutSuccessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: store } = useStoreBySlug(slug);
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [status, setStatus] = useState<"loading" | "succeeded" | "pending" | "canceled">("loading");

  const primaryColor = store?.store_settings?.primary_color || "#f59e0b";

  useEffect(() => {
    if (!orderId) return;
    let attempts = 0;
    const maxAttempts = 20;

    const checkPayment = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("orders")
        .select("payment_status")
        .eq("id", orderId)
        .single();

      const ps = (data as { payment_status: string | null } | null)?.payment_status;

      if (ps === "succeeded") {
        setStatus("succeeded");
        return;
      }
      if (ps === "canceled") {
        setStatus("canceled");
        return;
      }

      attempts++;
      if (attempts >= maxAttempts) {
        setStatus("pending");
        return;
      }

      setTimeout(checkPayment, 3000);
    };

    checkPayment();
  }, [orderId]);

  if (!orderId) {
    return (
      <div className="text-center py-20 space-y-4">
        <ShoppingBag className="h-16 w-16 text-gray-200 mx-auto" />
        <p className="s-muted">Заказ не найден</p>
        <Link href={`/store/${slug}`}>
          <Button style={{ backgroundColor: primaryColor }} className="text-white">
            В каталог
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-center py-16 space-y-6">
      {status === "loading" && (
        <>
          <Loader2 className="h-16 w-16 mx-auto animate-spin s-muted" />
          <h1 className="text-2xl font-bold s-text">Проверяем оплату...</h1>
          <p className="s-muted">Пожалуйста, подождите. Это займёт несколько секунд.</p>
        </>
      )}

      {status === "succeeded" && (
        <>
          <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold s-text">Оплата прошла успешно!</h1>
          <p className="s-muted">
            Заказ <span className="font-mono font-medium">{orderId.slice(0, 8)}</span> оплачен.
            Продавец уже получил уведомление.
          </p>
          <Link href={`/store/${slug}/orders`}>
            <Button
              size="lg"
              className="text-white hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              Мои заказы
            </Button>
          </Link>
        </>
      )}

      {status === "pending" && (
        <>
          <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
            <Clock className="h-10 w-10 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold s-text">Ожидаем подтверждение</h1>
          <p className="s-muted">
            Платёж обрабатывается. Статус обновится автоматически —
            проверьте заказы через пару минут.
          </p>
          <Link href={`/store/${slug}/orders`}>
            <Button
              size="lg"
              className="text-white hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              Мои заказы
            </Button>
          </Link>
        </>
      )}

      {status === "canceled" && (
        <>
          <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold s-text">Оплата отменена</h1>
          <p className="s-muted">
            Платёж не прошёл. Вы можете попробовать ещё раз или выбрать другой способ оплаты.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href={`/store/${slug}/cart`}>
              <Button variant="outline">В корзину</Button>
            </Link>
            <Link href={`/store/${slug}/orders`}>
              <Button
                className="text-white hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                Мои заказы
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
