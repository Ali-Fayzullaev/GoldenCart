-- 014: Дополнительные поля товаров (старая цена, вес, артикул)

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS compare_price NUMERIC(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS weight TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sku TEXT DEFAULT NULL;

-- variants теперь поддерживает цены:
-- [
--   {
--     "name": "Размер",
--     "values": ["S", "M", "L"],
--     "prices": { "S": 1000, "M": 1200, "L": 1400 }
--   }
-- ]
-- prices — необязательное поле; если не задано, используется базовая цена товара
