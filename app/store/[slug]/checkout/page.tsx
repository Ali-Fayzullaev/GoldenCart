"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Tag, Check, X, Gift, Truck, MapPin, ShoppingCart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStoreBySlug } from "@/lib/hooks/use-stores";
import { useCreateOrder } from "@/lib/hooks/use-orders";
import { useValidatePromoCode } from "@/lib/hooks/use-promo-codes";
import { useActiveShippingMethods } from "@/lib/hooks/use-shipping";
import { useCustomerAddresses } from "@/lib/hooks/use-addresses";
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
  const { data: savedAddresses } = useCustomerAddresses();
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
    setValue,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<CheckoutInput>({ resolver: zodResolver(checkoutSchema) as any });

  // Auto-fill default address
  useEffect(() => {
    if (savedAddresses?.length) {
      const def = savedAddresses.find((a) => a.is_default) || savedAddresses[0];
      if (def) {
        setValue("shipping_address", def.address);
        if (def.phone) setValue("phone", def.phone);
      }
    }
  }, [savedAddresses, setValue]);

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
        const selectedMethod = shippingMethods?.find((m) => m.id === selectedShipping);
        fetch("/api/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "new_order",
            chat_id: store.telegram_chat_id,
            store_name: store.name,
            order_id: crypto.randomUUID(),
            total: formatPrice(finalTotal),
            items_count: items.length,
            items: items.map((i) => ({
              name: i.name,
              qty: i.quantity,
              price: formatPrice(i.price * i.quantity),
            })),
            address: input.shipping_address,
            phone: input.phone,
            discount: (discount + firstOrderDiscount) > 0 ? formatPrice(discount + firstOrderDiscount) : undefined,
            promo_code: appliedPromo || undefined,
            shipping: selectedMethod?.name,
          }),
        }).catch(() => {});
      }

      // Email-уведомление продавцу (fire & forget)
      if (store.contact_email) {
        fetch("/api/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: store.contact_email,
            store_name: store.name,
            subject: `Новый заказ в ${store.name}`,
            type: "new_order",
            order_id: crypto.randomUUID(),
            total: formatPrice(finalTotal),
            items: items.map((i) => ({
              name: i.name,
              qty: i.quantity,
              price: formatPrice(i.price * i.quantity),
            })),
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
      <div className="text-center py-20 space-y-4">
        <ShoppingBag className="h-16 w-16 text-gray-200 mx-auto" />
        <h2 className="text-xl font-bold s-text">Корзина пуста</h2>
        <p className="s-muted text-sm">Добавьте товары, чтобы оформить заказ</p>
        <a
          href={`/store/${slug}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity"
          style={{ backgroundColor: primaryColor }}
        >
          ← Перейти в каталог
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-0 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Оформление заказа</h1>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-0">
          {[
            { icon: ShoppingCart, label: "Корзина", done: true },
            { icon: Truck, label: "Доставка", done: false, current: true },
            { icon: Check, label: "Готово", done: false },
          ].map((step, i, arr) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    step.done
                      ? "text-white"
                      : step.current
                        ? "text-white ring-2 ring-offset-2"
                        : "bg-gray-200 s-muted"
                  }`}
                  style={step.done || step.current ? { backgroundColor: primaryColor } : {}}
                >
                  {step.done ? <Check className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                </div>
                <span className={`text-xs mt-1 ${step.done || step.current ? "font-medium" : "s-muted"}`}>
                  {step.label}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div className={`w-8 sm:w-16 h-0.5 mx-1 sm:mx-2 mt-[-18px] ${step.done ? "" : "bg-gray-200"}`} style={step.done ? { backgroundColor: primaryColor } : {}} />
              )}
            </div>
          ))}
        </div>

        {/* Cart summary */}
          <div className="s-card rounded-2xl border s-border p-5 space-y-3 shadow-sm">
            <h2 className="font-semibold s-text">Ваш заказ</h2>
          {items.map((item) => (
            <div key={item.product_id} className="flex items-center gap-3 text-sm">
              {item.image ? (
                <img src={item.image} alt={item.name} className="h-12 w-12 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <ShoppingCart className="h-4 w-4 text-gray-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="block truncate">{item.name}</span>
                <span className="s-muted">× {item.quantity}</span>
              </div>
              <span className="font-medium shrink-0">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}

          {/* Промокод */}
        <div className="border-t pt-3 mt-2">
          {firstOrderDiscount > 0 && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mb-3">
                <Gift className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">
                Скидка на первую покупку: −{formatPrice(firstOrderDiscount)}
              </span>
            </div>
          )}
          {appliedPromo ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Промокод <span className="font-mono">{appliedPromo}</span>
                </span>
                <span className="text-sm text-green-600">
                  −{formatPrice(discount)}
                </span>
              </div>
              <button onClick={handleRemovePromo} className="s-muted hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 s-muted" />
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
          <div className="flex justify-between text-sm s-muted">
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
            <div className="flex justify-between text-sm text-emerald-600">
              <span>Скидка первой покупки</span>
              <span>−{formatPrice(firstOrderDiscount)}</span>
            </div>
          )}
          {shippingCost > 0 && (
            <div className="flex justify-between text-sm s-muted">
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
          <div className="s-card rounded-2xl border s-border p-4 sm:p-6 space-y-3 shadow-sm">
            <h2 className="font-semibold s-text flex items-center gap-2">
            <Truck className="h-5 w-5" /> Способ доставки
          </h2>
          {shippingMethods.map((method) => {
            const isFree = method.min_order_free && total >= method.min_order_free;
            return (
              <label
                key={method.id}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedShipping === method.id
                    ? "border-gray-900 bg-gray-50 shadow-sm"
                    : "s-border hover:border-gray-200 s-hover"
                }`}
              >
                <input
                  type="radio"
                  name="shipping"
                  value={method.id}
                  checked={selectedShipping === method.id}
                  onChange={() => setSelectedShipping(method.id)}
                  className="accent-gray-900"
                />
                <div className="flex-1">
                  <span className="font-medium text-sm">{method.name}</span>
                  {method.min_order_free && (
                    <p className="text-xs s-muted">
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
          className="s-card rounded-2xl border s-border p-4 sm:p-6 space-y-4 shadow-sm"
        >
          <h2 className="font-semibold s-text">Данные доставки</h2>
        {savedAddresses && savedAddresses.length > 0 && (
          <div className="space-y-2">
            <Label>Сохранённые адреса</Label>
            <div className="flex flex-wrap gap-2">
              {savedAddresses.map((addr) => (
                <button
                  key={addr.id}
                  type="button"
                  onClick={() => {
                    setValue("shipping_address", addr.address);
                    if (addr.phone) setValue("phone", addr.phone);
                  }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm border s-border rounded-xl s-hover hover:border-gray-300 transition-all"
                >
                  <MapPin className="h-3.5 w-3.5 s-muted" />
                  {addr.label || "Адрес"}
                  {addr.is_default && (
                    <span className="text-xs px-1 py-0.5 rounded text-white" style={{ backgroundColor: primaryColor }}>★</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

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
            className="w-full text-white hover:opacity-90 h-11 sm:h-12 rounded-xl text-sm sm:text-base font-semibold shadow-md"
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
