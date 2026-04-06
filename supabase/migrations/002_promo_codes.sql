-- ============================================
-- GoldenCart — Промокоды
-- Запустить ПОСЛЕ 001_initial.sql
-- ============================================

-- Удаляем если уже существует (для повторного запуска)
DROP FUNCTION IF EXISTS public.increment_promo_usage CASCADE;
DROP TABLE IF EXISTS promo_codes CASCADE;

-- Таблица промокодов
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percent'
    CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_uses INTEGER NOT NULL DEFAULT 0, -- 0 = безлимит
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

-- Покупатели могут читать активные промокоды (для проверки при оформлении)
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
