"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMyStore, useCreateStore, useUpdateStore } from "@/lib/hooks/use-stores";
import { storeSchema, type StoreInput } from "@/lib/validations";
import { STORE_CATEGORIES } from "@/lib/helpers";
import { toast } from "sonner";

export default function StoreManagementPage() {
  const { data: store, isLoading } = useMyStore();
  const createStore = useCreateStore();
  const updateStore = useUpdateStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<StoreInput>({
    resolver: zodResolver(storeSchema) as any,
    defaultValues: store
      ? {
          name: store.name,
          description: store.description,
          category: store.category,
          contact_email: store.contact_email,
        }
      : { category: "Другое" },
  });

  const category = watch("category");

  const onSubmit = async (input: StoreInput) => {
    try {
      if (store) {
        await updateStore.mutateAsync({ id: store.id, ...input });
        toast.success("Магазин обновлён");
      } else {
        await createStore.mutateAsync(input);
        toast.success("Магазин создан! Теперь настройте дизайн.");
      }
    } catch {
      toast.error("Ошибка сохранения");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  const isPending = createStore.isPending || updateStore.isPending;

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">
        {store ? "Настройки магазина" : "Создать магазин"}
      </h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-xl border p-6 space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="name">Название магазина</Label>
          <Input
            id="name"
            placeholder="Мой Магазин"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Описание</Label>
          <Textarea
            id="description"
            placeholder="Расскажите о вашем магазине..."
            rows={4}
            {...register("description")}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Категория</Label>
          <Select
            value={category}
            onValueChange={(val) => val && setValue("category", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите категорию" />
            </SelectTrigger>
            <SelectContent>
              {STORE_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-red-500">{errors.category.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_email">Контактный email</Label>
          <Input
            id="contact_email"
            type="email"
            placeholder="shop@example.com"
            {...register("contact_email")}
          />
          {errors.contact_email && (
            <p className="text-sm text-red-500">{errors.contact_email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-amber-500 hover:bg-amber-600"
          disabled={isPending}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {store ? "Сохранить" : "Создать магазин"}
        </Button>
      </form>
    </div>
  );
}
