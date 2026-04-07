"use client";

import { useState } from "react";
import { Truck, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMyStore } from "@/lib/hooks/use-stores";
import {
  useShippingMethods,
  useCreateShippingMethod,
  useUpdateShippingMethod,
  useDeleteShippingMethod,
} from "@/lib/hooks/use-shipping";
import { toast } from "sonner";

export default function ShippingPage() {
  const { data: store } = useMyStore();
  const { data: methods, isLoading } = useShippingMethods(store?.id);
  const createMethod = useCreateShippingMethod();
  const updateMethod = useUpdateShippingMethod();
  const deleteMethod = useDeleteShippingMethod();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [minFree, setMinFree] = useState("");

  const handleCreate = async () => {
    if (!store || !name.trim()) return;
    try {
      await createMethod.mutateAsync({
        store_id: store.id,
        name: name.trim(),
        price: Number(price) || 0,
        min_order_free: minFree ? Number(minFree) : null,
      });
      setName("");
      setPrice("");
      setMinFree("");
      toast.success("Способ доставки добавлен");
    } catch {
      toast.error("Ошибка создания");
    }
  };

  const handleUpdate = (id: string, field: string, value: string | number | boolean) => {
    updateMethod.mutate({ id, [field]: value } as never);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMethod.mutateAsync(id);
      toast.success("Удалено");
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Доставка</h1>

      {/* Добавление */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold">Добавить способ доставки</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Название</Label>
            <Input
              placeholder="Курьер, Почта, Самовывоз..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Стоимость (₽)</Label>
            <Input
              type="number"
              placeholder="300"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min={0}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Бесплатно от (₽)</Label>
            <Input
              type="number"
              placeholder="5000 (необязательно)"
              value={minFree}
              onChange={(e) => setMinFree(e.target.value)}
              min={0}
            />
          </div>
        </div>
        <Button onClick={handleCreate} disabled={createMethod.isPending || !name.trim()}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить
        </Button>
      </div>

      {/* Список */}
      {!methods?.length ? (
        <div className="text-center py-10 bg-white rounded-xl border">
          <Truck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Способов доставки пока нет</p>
          <p className="text-xs text-gray-400 mt-1">
            Если ни одного способа не создано, покупатель оформит заказ без выбора доставки
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-xl border p-4 flex flex-wrap items-center gap-4"
            >
              <div className="flex-1 min-w-[200px] space-y-2">
                <div>
                  <Label className="text-xs text-gray-500">Название</Label>
                  <Input
                    defaultValue={m.name}
                    className="h-8 text-sm"
                    onBlur={(e) => handleUpdate(m.id, "name", e.target.value)}
                  />
                </div>
              </div>
              <div className="w-32 space-y-2">
                <Label className="text-xs text-gray-500">Цена (₽)</Label>
                <Input
                  type="number"
                  defaultValue={m.price}
                  className="h-8 text-sm"
                  min={0}
                  onBlur={(e) => handleUpdate(m.id, "price", Number(e.target.value))}
                />
              </div>
              <div className="w-40 space-y-2">
                <Label className="text-xs text-gray-500">Бесплатно от (₽)</Label>
                <Input
                  type="number"
                  defaultValue={m.min_order_free ?? ""}
                  className="h-8 text-sm"
                  placeholder="—"
                  min={0}
                  onBlur={(e) =>
                    handleUpdate(
                      m.id,
                      "min_order_free",
                      e.target.value ? Number(e.target.value) : (null as never)
                    )
                  }
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleUpdate(m.id, "is_active", !m.is_active)}
                  className="p-1"
                >
                  {m.is_active ? (
                    <Eye className="h-4 w-4 text-green-500" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500"
                  onClick={() => handleDelete(m.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400">
        Если указано «Бесплатно от» — при заказе на эту сумму и выше доставка будет бесплатной.
      </p>
    </div>
  );
}
