"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Copy,
  Percent,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMyStore } from "@/lib/hooks/use-stores";
import {
  useStorePromoCodes,
  useCreatePromoCode,
  useDeletePromoCode,
  useTogglePromoCode,
} from "@/lib/hooks/use-promo-codes";
import { promoCodeSchema, type PromoCodeInput } from "@/lib/validations";
import { formatPrice } from "@/lib/helpers";
import { toast } from "sonner";

export default function PromoCodesPage() {
  const { data: store, isLoading: storeLoading } = useMyStore();
  const { data: codes, isLoading: codesLoading } = useStorePromoCodes(store?.id);
  const createPromo = useCreatePromoCode();
  const deletePromo = useDeletePromoCode();
  const togglePromo = useTogglePromoCode();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<PromoCodeInput>({
    resolver: zodResolver(promoCodeSchema) as any,
    defaultValues: { discount_type: "percent" },
  });

  const discountType = watch("discount_type");

  const onSubmit = async (input: PromoCodeInput) => {
    if (!store) return;
    try {
      await createPromo.mutateAsync({
        store_id: store.id,
        code: input.code,
        discount_type: input.discount_type,
        discount_value: input.discount_value,
        min_order_amount: input.min_order_amount,
        max_uses: input.max_uses,
        expires_at: input.expires_at,
      });
      toast.success("Промокод создан!");
      reset();
      setOpen(false);
    } catch {
      toast.error("Ошибка создания промокода");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePromo.mutateAsync(id);
      toast.success("Промокод удалён");
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  const handleToggle = async (id: string, currentState: boolean) => {
    try {
      await togglePromo.mutateAsync({ id, is_active: !currentState });
      toast.success(!currentState ? "Промокод активирован" : "Промокод отключён");
    } catch {
      toast.error("Ошибка");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Код скопирован");
  };

  if (storeLoading || codesLoading) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Промокоды</h1>
          <p className="text-gray-500 mt-1">
            Создавайте скидки для привлечения покупателей
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="bg-amber-500 hover:bg-amber-600"><Plus className="mr-2 h-4 w-4" />Новый промокод</Button>} />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Новый промокод</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Код</Label>
                <Input
                  placeholder="SALE20"
                  className="uppercase font-mono"
                  {...register("code")}
                />
                {errors.code && (
                  <p className="text-sm text-red-500">{errors.code.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Тип скидки</Label>
                  <Select
                    value={discountType}
                    onValueChange={(val) =>
                      val && setValue("discount_type", val as "percent" | "fixed")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Процент (%)</SelectItem>
                      <SelectItem value="fixed">Фиксированная (₽)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    Размер скидки{" "}
                    {discountType === "percent" ? "(%)" : "(₽)"}
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={discountType === "percent" ? "10" : "500"}
                    {...register("discount_value")}
                  />
                  {errors.discount_value && (
                    <p className="text-sm text-red-500">
                      {errors.discount_value.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Мин. сумма заказа (₽)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    {...register("min_order_amount")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Макс. использований</Label>
                  <Input
                    type="number"
                    placeholder="0 = безлимит"
                    {...register("max_uses")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Срок действия (необязательно)</Label>
                <Input type="datetime-local" {...register("expires_at")} />
              </div>

              <Button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600"
                disabled={createPromo.isPending}
              >
                {createPromo.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Создать
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Список промокодов */}
      {!codes?.length ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Percent className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Промокодов пока нет</p>
          <p className="text-sm text-gray-400 mt-1">
            Создайте первый промокод для привлечения покупателей
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {codes.map((promo) => {
            const isExpired =
              promo.expires_at && new Date(promo.expires_at) < new Date();
            const isExhausted =
              promo.max_uses > 0 && promo.used_count >= promo.max_uses;

            return (
              <div
                key={promo.id}
                className={`bg-white rounded-xl border p-4 flex items-center gap-4 transition-opacity ${
                  !promo.is_active || isExpired || isExhausted
                    ? "opacity-60"
                    : ""
                }`}
              >
                {/* Код */}
                <div
                  className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => copyCode(promo.code)}
                >
                  <span className="font-mono font-bold text-lg">
                    {promo.code}
                  </span>
                  <Copy className="h-4 w-4 text-gray-400" />
                </div>

                {/* Инфо */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {promo.discount_type === "percent" ? (
                      <span className="flex items-center gap-1 text-sm font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                        <Percent className="h-3 w-3" />
                        {promo.discount_value}%
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                        <DollarSign className="h-3 w-3" />
                        {formatPrice(promo.discount_value)}
                      </span>
                    )}

                    {promo.min_order_amount > 0 && (
                      <span className="text-xs text-gray-500">
                        от {formatPrice(promo.min_order_amount)}
                      </span>
                    )}

                    {isExpired && (
                      <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded">
                        Истёк
                      </span>
                    )}
                    {isExhausted && (
                      <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded">
                        Исчерпан
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>
                      Использован:{" "}
                      {promo.used_count}
                      {promo.max_uses > 0 ? ` / ${promo.max_uses}` : ""}
                    </span>
                    {promo.expires_at && (
                      <span>
                        до{" "}
                        {new Date(promo.expires_at).toLocaleDateString("ru-RU")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Действия */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(promo.id, promo.is_active)}
                  >
                    {promo.is_active ? (
                      <ToggleRight className="h-5 w-5 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-gray-400" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(promo.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
