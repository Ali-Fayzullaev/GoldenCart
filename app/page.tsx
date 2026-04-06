import Link from "next/link";
import { ShoppingBag, Palette, Share2, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-amber-600">
            🛒 GoldenCart
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Войти</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-amber-500 hover:bg-amber-600">
                Создать магазин
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
          Создайте свой
          <span className="text-amber-500"> интернет-магазин</span>
          <br />
          за 5 минут
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Регистрируйтесь, настраивайте дизайн, добавляйте товары — и делитесь
          ссылкой на свой магазин с покупателями. Без программирования.
        </p>
        <Link href="/register">
          <Button
            size="lg"
            className="bg-amber-500 hover:bg-amber-600 text-lg px-8 py-6"
          >
            Начать бесплатно
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Всё что нужно для продаж онлайн
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<ShoppingBag className="h-8 w-8 text-amber-500" />}
            title="Свой магазин"
            description="Создайте полноценный интернет-магазин с каталогом товаров и системой заказов"
          />
          <FeatureCard
            icon={<Palette className="h-8 w-8 text-amber-500" />}
            title="Свой дизайн"
            description="Настройте цвета, шрифт, логотип и баннер — магазин будет выглядеть как ваш бренд"
          />
          <FeatureCard
            icon={<Share2 className="h-8 w-8 text-amber-500" />}
            title="Поделитесь ссылкой"
            description="Отправьте ссылку на магазин в соцсетях или мессенджерах — покупатели зарегистрируются сами"
          />
          <FeatureCard
            icon={<Shield className="h-8 w-8 text-amber-500" />}
            title="Изоляция данных"
            description="Покупатели видят только ваш магазин. Данные других магазинов полностью скрыты"
          />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Как это работает
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <StepCard
              step={1}
              title="Зарегистрируйтесь"
              description="Создайте аккаунт продавца за 30 секунд"
            />
            <StepCard
              step={2}
              title="Настройте магазин"
              description="Выберите цвета, добавьте логотип и товары"
            />
            <StepCard
              step={3}
              title="Делитесь ссылкой"
              description="Покупатели регистрируются в вашем магазине и делают заказы"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-gray-500">
          © {new Date().getFullYear()} GoldenCart. Платформа для создания интернет-магазинов.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-amber-500 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
        {step}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}
