-- ============================================
-- GoldenCart SaaS — Конструктор интернет-магазинов
-- ============================================

-- Удаляем старые таблицы (если есть от предыдущего проекта)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_store_created ON stores;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_store() CASCADE;

DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS store_customers CASCADE;
DROP TABLE IF EXISTS store_settings CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Удаляем старые storage policies
DO $$
BEGIN
  DELETE FROM storage.objects WHERE bucket_id IN ('logos', 'banners', 'products');
  DELETE FROM storage.buckets WHERE id IN ('logos', 'banners', 'products');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 1. Профили пользователей (продавцы и покупатели)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('seller', 'customer')) DEFAULT 'customer',
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Каждый видит только свой профиль
CREATE POLICY "Users view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. Магазины продавцов
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Другое',
  contact_email TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stores_owner ON stores(owner_id);
CREATE INDEX idx_stores_slug ON stores(slug);

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Продавец видит свой магазин, активные магазины видны всем
CREATE POLICY "Owner manages store"
  ON stores FOR ALL
  USING (auth.uid() = owner_id);

CREATE POLICY "Active stores are public"
  ON stores FOR SELECT
  USING (is_active = true);

-- 3. Настройки внешнего вида магазина
CREATE TABLE store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL UNIQUE REFERENCES stores(id) ON DELETE CASCADE,
  primary_color TEXT NOT NULL DEFAULT '#f59e0b',
  secondary_color TEXT NOT NULL DEFAULT '#1f2937',
  accent_color TEXT NOT NULL DEFAULT '#10b981',
  background_color TEXT NOT NULL DEFAULT '#ffffff',
  text_color TEXT NOT NULL DEFAULT '#111827',
  font TEXT NOT NULL DEFAULT 'Inter',
  logo_url TEXT,
  banner_url TEXT,
  welcome_text TEXT NOT NULL DEFAULT 'Добро пожаловать в наш магазин!',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Владелец магазина управляет настройками
CREATE POLICY "Owner manages settings"
  ON store_settings FOR ALL
  USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

-- Настройки видны всем (для отрисовки витрины)
CREATE POLICY "Settings are public"
  ON store_settings FOR SELECT
  USING (true);

-- 4. Покупатели конкретного магазина (изоляция!)
CREATE TABLE store_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, customer_id)
);

CREATE INDEX idx_store_customers_store ON store_customers(store_id);
CREATE INDEX idx_store_customers_customer ON store_customers(customer_id);

ALTER TABLE store_customers ENABLE ROW LEVEL SECURITY;

-- Продавец видит покупателей своего магазина
CREATE POLICY "Owner sees store customers"
  ON store_customers FOR SELECT
  USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

-- Покупатель видит свою привязку
CREATE POLICY "Customer sees own binding"
  ON store_customers FOR SELECT
  USING (auth.uid() = customer_id);

-- Покупатель может зарегистрироваться в магазине
CREATE POLICY "Customer registers in store"
  ON store_customers FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- 5. Товары
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  images TEXT[] NOT NULL DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'Другое',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_store ON products(store_id);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Продавец управляет своими товарами
CREATE POLICY "Owner manages products"
  ON products FOR ALL
  USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

-- Активные товары видны всем
CREATE POLICY "Active products are public"
  ON products FOR SELECT
  USING (is_active = true);

-- 6. Заказы
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_address TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_store ON orders(store_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Продавец видит заказы своего магазина
CREATE POLICY "Owner manages orders"
  ON orders FOR ALL
  USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

-- Покупатель видит свои заказы
CREATE POLICY "Customer sees own orders"
  ON orders FOR SELECT
  USING (auth.uid() = customer_id);

-- Покупатель может создавать заказы
CREATE POLICY "Customer creates orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- 7. Позиции заказа
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_time NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Продавец видит позиции заказов своего магазина
CREATE POLICY "Owner sees order items"
  ON order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE store_id IN (
        SELECT id FROM stores WHERE owner_id = auth.uid()
      )
    )
  );

-- Покупатель видит свои позиции
CREATE POLICY "Customer sees own order items"
  ON order_items FOR SELECT
  USING (
    order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
  );

-- Покупатель создаёт позиции
CREATE POLICY "Customer creates order items"
  ON order_items FOR INSERT
  WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
  );

-- ============================================
-- Триггеры
-- ============================================

-- Автосоздание профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (
    NEW.id,
    CASE WHEN NEW.raw_user_meta_data ->> 'role' = 'seller' THEN 'seller' ELSE 'customer' END,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.email, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Создаём профили для уже существующих пользователей (если регистрация была до миграции)
INSERT INTO public.profiles (id, role, full_name, email)
SELECT
  id,
  CASE WHEN raw_user_meta_data ->> 'role' = 'seller' THEN 'seller' ELSE 'customer' END,
  COALESCE(raw_user_meta_data ->> 'full_name', ''),
  COALESCE(email, '')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Автосоздание настроек при создании магазина
CREATE OR REPLACE FUNCTION public.handle_new_store()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.store_settings (store_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_store_created
  AFTER INSERT ON stores
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_store();

-- ============================================
-- 8. Промокоды
-- ============================================

CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percent'
    CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_uses INTEGER NOT NULL DEFAULT 0, -- 0 = unlimited
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, code)
);

CREATE INDEX idx_promo_codes_store ON promo_codes(store_id);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- Продавец управляет промокодами своего магазина
CREATE POLICY "Owner manages promo codes"
  ON promo_codes FOR ALL
  USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

-- Покупатели могут читать активные промокоды (проверка при оформлении)
CREATE POLICY "Customers read active promo codes"
  ON promo_codes FOR SELECT
  USING (is_active = true);

-- Функция для увеличения счётчика использования промокода
CREATE OR REPLACE FUNCTION public.increment_promo_usage(
  promo_code_text TEXT,
  promo_store_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE promo_codes
  SET used_count = used_count + 1
  WHERE code = promo_code_text
    AND store_id = promo_store_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Storage buckets
-- ============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true) ON CONFLICT (id) DO NOTHING;

-- Продавцы загружают в свои папки
CREATE POLICY "Sellers upload logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');

CREATE POLICY "Sellers upload banners"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'banners' AND auth.role() = 'authenticated');

CREATE POLICY "Sellers upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'products' AND auth.role() = 'authenticated');

-- Публичное чтение
CREATE POLICY "Public reads logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'logos');

CREATE POLICY "Public reads banners"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banners');

CREATE POLICY "Public reads product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'products');

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
