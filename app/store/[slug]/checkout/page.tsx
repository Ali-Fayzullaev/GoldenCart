"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Tag, Check, X, Gift, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStoreBySlug } from "@/lib/hooks/use-stores";
import { useCreateOrder } from "@/lib/hooks/use-orders";
import { useValidatePromoCode } from "@/lib/hooks/use-promo-codes";
import { useActiveShippingMethods } from "@/lib/hooks/use-shipping";
import { useCartStore } from "@/lib/store/cart-store";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations";
import { formatPrice } from "@/lib/helpers";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: store } = useStoreBySlug(slug);
  const router = useRouter();
  const createOrder = useCreateOrder();
  const getStoreItems = useCartStore((s) => s.getStoreItems);
  const getStoreTotal = useCartStore((s) => s.getStoreTotal);
  const clearStoreCart = useCartStore((s) => s.clearStoreCart);

  const [items, setItems] = useState<ReturnType<typeof getStoreItems>>([]);
  const [total, setTotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [firstOrderDiscount, setFirstOrderDiscount] = useState(0);
  const validatePromo = useValidatePromoCode();
  const { data: shippingMethods } = useActiveShippingMethods(store?.id);
  const [selectedShipping, setSelectedShipping] = useState<string | null>(null);

  useEffect(() => {
    if (store) {
      setItems(getStoreItems(store.id));
      setTotal(getStoreTotal(store.id));
    }
  }, [store, getStoreItems, getStoreTotal]);

  // Проверяем, есть ли у клиента предыдущие заказы в этом магазине
  useEffect(() => {
    if (!store || !store.first_order_discount_type) return;
    const checkFirstOrder = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("store_id", store.id)
        .eq("customer_id", user.id);
      if (count === 0) {
        const storeTotal = getStoreTotal(store.id);
        const disc =
          store.first_order_discount_type === "percent"
            ? Math.round(storeTotal * (store.first_order_discount_value / 100))
            : store.first_order_discount_value;
        setFirstOrderDiscount(disc);
      }
    };
    checkFirstOrder();
  }, [store, getStoreTotal]);

  const shippingCost = (() => {
    if (!shippingMethods?.length || !selectedShipping) return 0;
    const method = shippingMethods.find((m) => m.id === selectedShipping);
    if (!method) return 0;
    if (method.min_order_free && total >= method.min_order_free) return 0;
    return method.price;
  })();

  const finalTotal = Math.max(0, total - discount - firstOrderDiscount + shippingCost);

  const handleApplyPromo = async () => {
    if (!store || !promoInput.trim()) return;
    try {
      const result = await validatePromo.mutateAsync({
        storeId: store.id,
        code: promoInput.trim(),
        orderTotal: total,
      });
      setDiscount(result.discount);
      setAppliedPromo(result.promo.code);
      toast.success(
        `Скидка ${result.promo.discount_type === "percent" ? result.promo.discount_value + "%" : formatPrice(result.promo.discount_value)} применена!`
      );
    } catch (err) {
      setDiscount(0);
      setAppliedPromo(null);
      toast.error(err instanceof Error ? err.message : "Промокод недействителен");
    }
  };

  const handleRemovePromo = () => {
    setDiscount(0);
    setAppliedPromo(null);
    setPromoInput("");
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<CheckoutInput>({ resolver: zodResolver(checkoutSchema) as any });

  const primaryColor = store?.store_settings?.primary_color || "#f59e0b";

  const onSubmit = async (input: CheckoutInput) => {
    if (!store || !items.length) return;
    try {
      await createOrder.mutateAsync({
        store_id: store.id,
        shipping_address: input.shipping_address,
        phone: input.phone,
        notes: input.notes || "",
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          price: i.price,
        })),
        discount: discount + firstOrderDiscount,
        promo_code: appliedPromo || undefined,
      });

      // Telegram-уведомление продавцу (fire & forget)
      if (store.telegram_chat_id) {
        fetch("/api/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: store.telegram_chat_id,
            store_name: store.name,
            order_id: crypto.randomUUID(),
            total: formatPrice(finalTotal),
            items_count: items.length,
            address: input.shipping_address,
            phone: input.phone,
          }),
        }).catch(() => {});
      }

      clearStoreCart(store.id);
      toast.success("Заказ оформлен!");
      router.push(`/store/${slug}/orders`);
    } catch {
      toast.error("Ошибка оформления заказа");
    }
  };

  if (!items.length) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Корзина пуста</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">Оформление заказа</h1>

      {/* Cart summary */}
      <div className="bg-white rounded-xl border p-4 space-y-2">
        <h2 className="font-semibold">Ваш заказ</h2>
        {items.map((item) => (
          <div key={item.product_id} className="flex justify-between text-sm">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span className="font-medium">
              {formatPrice(item.price * item.quantity)}
            </span>
          </div>
        ))}

        {/* Промокод */}
        <div className="border-t pt-3 mt-2">
          {firstOrderDiscount > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
              <Gift className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">
                Скидка на первую покупку: −{formatPrice(firstOrderDiscount)}
              </span>
            </div>
          )}
          {appliedPromo ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Промокод <span className="font-mono">{appliedPromo}</span>
                </span>
                <span className="text-sm text-green-600">
                  −{formatPrice(discount)}
                </span>
              </div>
              <button onClick={handleRemovePromo} className="text-gray-400 hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Промокод"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className="pl-9 font-mono uppercase"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleApplyPromo())}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleApplyPromo}
                disabled={validatePromo.isPending || !promoInput.trim()}
              >
                {validatePromo.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Применить"
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="border-t pt-2 space-y-1">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Подитог</span>
            <span>{formatPrice(total)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Промокод</span>
              <span>−{formatPrice(discount)}</span>
            </div>
          )}
          {firstOrderDiscount > 0 && (
            <div className="flex justify-between text-sm text-amber-600">
              <span>Скидка первой покупки</span>
              <span>−{formatPrice(firstOrderDiscount)}</span>
            </div>
          )}
          {shippingCost > 0 && (
            <div className="flex justify-between text-sm text-gray-500">
              <span>Доставка</span>
              <span>+{formatPrice(shippingCost)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-1">
            <span>Итого</span>
            <span style={{ color: primaryColor }}>{formatPrice(finalTotal)}</span>
          </div>
        </div>
      </div>

      {/* Shipping */}
      {shippingMethods && shippingMethods.length > 0 && (
        <div className="bg-white rounded-xl border p-6 space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Truck className="h-5 w-5" /> Способ доставки
          </h2>
          {shippingMethods.map((method) => {
            const isFree = method.min_order_free && total >= method.min_order_free;
            return (
              <label
                key={method.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedShipping === method.id
                    ? "border-amber-400 bg-amber-50"
                    : "hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="shipping"
                  value={method.id}
                  checked={selectedShipping === method.id}
                  onChange={() => setSelectedShipping(method.id)}
                  className="accent-amber-500"
                />
                <div className="flex-1">
                  <span className="font-medium text-sm">{method.name}</span>
                  {method.min_order_free && (
                    <p className="text-xs text-gray-400">
                      Бесплатно от {formatPrice(method.min_order_free)}
                    </p>
                  )}
                </div>
                <span className="text-sm font-medium" style={{ color: isFree ? "#16a34a" : undefined }}>
                  {isFree ? "Бесплатно" : method.price > 0 ? formatPrice(method.price) : "Бесплатно"}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {/* Delivery form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-xl border p-6 space-y-4"
      >
        <h2 className="font-semibold">Данные доставки</h2>

        <div className="space-y-2">
          <Label htmlFor="shipping_address">Адрес доставки</Label>
          <Textarea
            id="shipping_address"
            placeholder="Город, улица, дом, квартира"
            rows={3}
            {...register("shipping_address")}
          />
          {errors.shipping_address && (
            <p className="text-sm text-red-500">{errors.shipping_address.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Телефон</Label>
          <Input
            id="phone"
            placeholder="+7 (999) 123-45-67"
            {...register("phone")}
          />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Комментарий (необязательно)</Label>
          <Textarea
            id="notes"
            placeholder="Особые пожелания..."
            rows={2}
            {...register("notes")}
          />
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full text-white hover:opacity-90"
          style={{ backgroundColor: primaryColor }}
          disabled={createOrder.isPending}
        >
          {createOrder.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Оформить заказ — {formatPrice(finalTotal)}
        </Button>
      </form>
    </div>
  );
}
