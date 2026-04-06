-- 006: Избранное покупателя (Wishlist)

CREATE TABLE IF NOT EXISTS wishlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_customer ON wishlists(customer_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_store ON wishlists(store_id);

-- RLS
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- Покупатель видит только свои
CREATE POLICY "wishlists_select" ON wishlists
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "wishlists_insert" ON wishlists
  FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "wishlists_delete" ON wishlists
  FOR DELETE USING (customer_id = auth.uid());
