-- 007: Скидка на первую покупку (настройка в stores)

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS first_order_discount_type TEXT DEFAULT NULL
    CHECK (first_order_discount_type IN ('percent', 'fixed')),
  ADD COLUMN IF NOT EXISTS first_order_discount_value NUMERIC DEFAULT 0;

COMMENT ON COLUMN stores.first_order_discount_type IS 'Тип скидки на первую покупку (percent/fixed) или NULL если отключено';
COMMENT ON COLUMN stores.first_order_discount_value IS 'Значение скидки (% или фикс. сумма)';
