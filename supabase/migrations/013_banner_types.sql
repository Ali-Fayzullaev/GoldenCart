-- Новые поля для расширенных баннеров (типы, stories, описания)
ALTER TABLE store_banners
  ADD COLUMN IF NOT EXISTS banner_type TEXT NOT NULL DEFAULT 'slider',
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS button_text TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS gradient_color TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN store_banners.banner_type IS 'slider = обычный баннер, story = сториз-круг';
COMMENT ON COLUMN store_banners.description IS 'Описание/текст поверх баннера';
COMMENT ON COLUMN store_banners.button_text IS 'Текст кнопки CTA';
COMMENT ON COLUMN store_banners.gradient_color IS 'Цвет градиента наложения';
COMMENT ON COLUMN store_banners.expires_at IS 'Дата истечения (NULL = бессрочно)';
