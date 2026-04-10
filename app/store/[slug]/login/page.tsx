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
  customerLoginSchema,
  type CustomerLoginInput,
} from "@/lib/validations";
import { useStoreBySlug } from "@/lib/hooks/use-stores";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function StoreLoginPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: store } = useStoreBySlug(slug);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<CustomerLoginInput>({ resolver: zodResolver(customerLoginSchema) as any });

  const primaryColor = store?.store_settings?.primary_color || "#f59e0b";

  const onSubmit = async (input: CustomerLoginInput) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      // Link to store if not already linked
      if (store) {
        const { data: { session: sess } } = await supabase.auth.getSession();
        if (sess?.user) {
          await supabase
            .from("store_customers")
            .upsert({
              store_id: store.id,
              customer_id: sess.user.id,
            } as never, { onConflict: "store_id,customer_id" });
        }
      }

      router.push(`/store/${slug}`);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      router.refresh();
    } catch {
      toast.error("Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Вход</h1>
        <p className="text-sm text-gray-500 mt-1">
          Войдите в магазин {store?.name}
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="s-card p-6 rounded-xl shadow-sm border space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Пароль</Label>
          <Input id="password" type="password" placeholder="Ваш пароль" {...register("password")} />
          {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
        </div>

        <Button
          type="submit"
          className="w-full text-white hover:opacity-90"
          style={{ backgroundColor: primaryColor }}
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Войти
        </Button>

        <p className="text-center text-sm text-gray-500">
          Нет аккаунта?{" "}
          <Link href={`/store/${slug}/register`} className="underline" style={{ color: primaryColor }}>
            Зарегистрироваться
          </Link>
        </p>
      </form>
    </div>
  );
}
