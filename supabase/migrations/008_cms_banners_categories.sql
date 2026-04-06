-- 008: CMS-страницы, баннеры и кастомные категории магазина

-- CMS-страницы
CREATE TABLE IF NOT EXISTS store_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  blocks JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, slug)
);

ALTER TABLE store_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_pages_read" ON store_pages FOR SELECT USING (is_published = true);
CREATE POLICY "store_pages_owner" ON store_pages FOR ALL USING (
  store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
);

-- Баннеры
CREATE TABLE IF NOT EXISTS store_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  link TEXT DEFAULT '',
  title TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE store_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_banners_read" ON store_banners FOR SELECT USING (is_active = true);
CREATE POLICY "store_banners_owner" ON store_banners FOR ALL USING (
  store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
);

-- Кастомные категории магазина
CREATE TABLE IF NOT EXISTS store_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES store_categories(id) ON DELETE CASCADE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE store_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_categories_read" ON store_categories FOR SELECT USING (true);
CREATE POLICY "store_categories_owner" ON store_categories FOR ALL USING (
  store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
);

COMMENT ON TABLE store_pages IS 'Кастомные CMS-страницы магазина (О нас, Доставка и пр.)';
COMMENT ON TABLE store_banners IS 'Акционные баннеры/слайдер на витрине магазина';
COMMENT ON TABLE store_categories IS 'Кастомные категории магазина (дерево)';
