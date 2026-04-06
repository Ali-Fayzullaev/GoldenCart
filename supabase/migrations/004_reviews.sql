-- ============================================
-- GoldenCart — Отзывы покупателей
-- Запустить ПОСЛЕ 001_initial.sql
-- ============================================

DROP TABLE IF EXISTS reviews CASCADE;

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, customer_id) -- один отзыв на товар от покупателя
);

CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_store ON reviews(store_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Отзывы видны всем (публичные)
CREATE POLICY "Reviews are public"
  ON reviews FOR SELECT
  USING (true);

-- Покупатель создаёт свой отзыв
CREATE POLICY "Customer creates review"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Покупатель может обновить свой отзыв
CREATE POLICY "Customer updates own review"
  ON reviews FOR UPDATE
  USING (auth.uid() = customer_id);

-- Покупатель может удалить свой отзыв
CREATE POLICY "Customer deletes own review"
  ON reviews FOR DELETE
  USING (auth.uid() = customer_id);

-- Продавец может удалять отзывы в своём магазине
CREATE POLICY "Owner deletes reviews in store"
  ON reviews FOR DELETE
  USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );
