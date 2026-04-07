-- ============================================
-- 009: Доставка, Модерация отзывов, Блог, FAQ, Соцсети
-- ============================================

-- =========== ДОСТАВКА ===========
CREATE TABLE shipping_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  min_order_free NUMERIC DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Продавец управляет способами доставки"
  ON shipping_methods FOR ALL
  USING (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()));

CREATE POLICY "Покупатели видят активные способы доставки"
  ON shipping_methods FOR SELECT
  USING (is_active = true);

-- =========== МОДЕРАЦИЯ ОТЗЫВОВ ===========
ALTER TABLE stores ADD COLUMN IF NOT EXISTS reviews_enabled BOOLEAN DEFAULT true;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS reviews_moderation BOOLEAN DEFAULT false;

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';

-- =========== БЛОГ ===========
CREATE TABLE blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '[]',
  cover_image TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Продавец управляет блогом"
  ON blog_posts FOR ALL
  USING (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()));

CREATE POLICY "Покупатели видят опубликованные статьи"
  ON blog_posts FOR SELECT
  USING (is_published = true);

-- =========== FAQ ===========
CREATE TABLE store_faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE store_faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Продавец управляет FAQ"
  ON store_faqs FOR ALL
  USING (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()));

CREATE POLICY "Покупатели видят активные FAQ"
  ON store_faqs FOR SELECT
  USING (is_active = true);

-- =========== СОЦСЕТИ (в store_settings) ===========
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS instagram_url TEXT DEFAULT '';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS telegram_url TEXT DEFAULT '';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS vk_url TEXT DEFAULT '';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS whatsapp_url TEXT DEFAULT '';
