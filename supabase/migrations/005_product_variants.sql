-- 005: Варианты товаров (размер, цвет, вес и т.д.)

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;

-- variants хранит массив вариантов:
-- [
--   { "name": "Размер", "values": ["S", "M", "L", "XL"] },
--   { "name": "Цвет", "values": ["Красный", "Синий", "Чёрный"] },
--   { "name": "Вес", "values": ["250г", "500г", "1кг"] }
-- ]

COMMENT ON COLUMN products.variants IS 'Массив вариантов товара [{name, values[]}]';
