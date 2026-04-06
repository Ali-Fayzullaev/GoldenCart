"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  customerRegisterSchema,
  type CustomerRegisterInput,
} from "@/lib/validations";
import { useStoreBySlug } from "@/lib/hooks/use-stores";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function StoreRegisterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: store } = useStoreBySlug(slug);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<CustomerRegisterInput>({ resolver: zodResolver(customerRegisterSchema) as any });

  const primaryColor = store?.store_settings?.primary_color || "#f59e0b";

  const onSubmit = async (input: CustomerRegisterInput) => {
    if (!store) return;
    setLoading(true);
    try {
      // 1. Register the user as customer
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            full_name: input.full_name,
            role: "customer",
          },
        },
      });

      if (authError) {
        toast.error(authError.message);
        return;
      }

      // 2. Link customer to this store
      if (authData.user) {
        await supabase
          .from("store_customers")
          .insert({
            store_id: store.id,
            customer_id: authData.user.id,
          } as never);
      }

      toast.success("Регистрация успешна! Проверьте почту.");
      router.push(`/store/${slug}/login`);
    } catch {
      toast.error("Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Регистрация</h1>
        <p className="text-sm text-gray-500 mt-1">
          Создайте аккаунт в магазине {store?.name}
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-6 rounded-xl shadow-sm border space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="full_name">Ваше имя</Label>
          <Input id="full_name" placeholder="Иван Иванов" {...register("full_name")} />
          {errors.full_name && <p className="text-sm text-red-500">{errors.full_name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Пароль</Label>
          <Input id="password" type="password" placeholder="Минимум 6 символов" {...register("password")} />
          {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
        </div>

        <Button
          type="submit"
          className="w-full text-white hover:opacity-90"
          style={{ backgroundColor: primaryColor }}
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Зарегистрироваться
        </Button>

        <p className="text-center text-sm text-gray-500">
          Уже есть аккаунт?{" "}
          <Link href={`/store/${slug}/login`} className="underline" style={{ color: primaryColor }}>
            Войти
          </Link>
        </p>
      </form>
    </div>
  );
}
