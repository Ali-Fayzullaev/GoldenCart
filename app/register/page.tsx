"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  sellerRegisterSchema,
  type SellerRegisterInput,
} from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<SellerRegisterInput>({ resolver: zodResolver(sellerRegisterSchema) as any });

  const onSubmit = async (input: SellerRegisterInput) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            full_name: input.full_name,
            role: "seller",
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Аккаунт создан! Проверьте почту для подтверждения.");
      router.push("/login");
    } catch {
      toast.error("Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/icons/light-logo.png" alt="GoldenCart" width={44} height={44} className="dark:hidden" />
            <Image src="/icons/dark-logo.png" alt="GoldenCart" width={44} height={44} className="hidden dark:block" />
            <span className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">GoldenCart</span>
          </Link>
          <h1 className="text-2xl font-bold mt-4">Создайте аккаунт продавца</h1>
          <p className="text-gray-500 mt-1">
            Зарегистрируйтесь и создайте свой интернет-магазин
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white p-6 rounded-xl shadow-sm border space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="full_name">Ваше имя</Label>
            <Input
              id="full_name"
              placeholder="Иван Иванов"
              {...register("full_name")}
            />
            {errors.full_name && (
              <p className="text-sm text-red-500">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              placeholder="Минимум 6 символов"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Зарегистрироваться
          </Button>

          <p className="text-center text-sm text-gray-500">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-amber-600 hover:underline">
              Войти
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
